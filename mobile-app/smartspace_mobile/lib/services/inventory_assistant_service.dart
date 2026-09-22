import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_config.dart';

class InventoryAssistantService {
  final http.Client _client;
  final FlutterSecureStorage _secureStorage;

  static const String tokenKey = 'smartspace_jwt_token';

  InventoryAssistantService({
    http.Client? client,
    FlutterSecureStorage? secureStorage,
  })  : _client = client ?? http.Client(),
        _secureStorage = secureStorage ?? const FlutterSecureStorage();

  Future<String?> _getToken() async {
    try {
      final token = await _secureStorage.read(key: tokenKey);
      if (token != null && token.isNotEmpty) return token;
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(tokenKey);
    } catch (_) {
      return null;
    }
  }

  /// Sends messages to the Inventory Assistant AI service.
  /// Tries the ASP.NET backend proxy first (eliminating mobile networking issues),
  /// and falls back to direct connection if needed.
  Future<Map<String, dynamic>> sendMessage({
    required List<Map<String, String>> messages,
    Map<String, dynamic>? pendingAction,
  }) async {
    final token = await _getToken();
    final body = jsonEncode({
      'messages': messages,
      'pending_action': pendingAction,
    });
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };

    // 1. Try via ASP.NET Core backend proxy (primary route for mobile devices)
    try {
      final proxyUri = Uri.parse(ApiConfig.aiProxyUrl);
      final response = await _client
          .post(proxyUri, headers: headers, body: body)
          .timeout(const Duration(seconds: 40));

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {
      // Backend proxy unavailable, proceed to direct AI service fallback
    }

    // 2. Direct fallback to Python AI service
    final directUri = Uri.parse('${ApiConfig.aiBaseUrl}/inventory-assistant/chat');
    final response = await _client
        .post(directUri, headers: headers, body: body)
        .timeout(const Duration(seconds: 40));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      try {
        final err = jsonDecode(response.body);
        throw Exception(err['detail'] ?? err['message'] ?? 'AI service error (${response.statusCode})');
      } catch (e) {
        if (e is Exception && !e.toString().contains('FormatException')) {
          rethrow;
        }
        throw Exception('AI assistant failed with status code ${response.statusCode}');
      }
    }
  }
}
