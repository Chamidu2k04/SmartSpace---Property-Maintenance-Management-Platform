import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'storage_service.dart';

class UserService {
  final SecureStorageService _storageService = SecureStorageService();

  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5030/api/users';
    } else if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5030/api/users';
    } else {
      return 'http://localhost:5030/api/users';
    }
  }

  /// Fetch all users with optional partial search.
  Future<List<Map<String, dynamic>>> fetchUsers({String searchQuery = ''}) async {
    final token = await _storageService.getToken();

    final uri = Uri.parse(
      searchQuery.trim().isNotEmpty
          ? '$baseUrl?search=${Uri.encodeComponent(searchQuery.trim())}'
          : baseUrl,
    );

    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    ).timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.cast<Map<String, dynamic>>();
    } else {
      final data = jsonDecode(response.body).catchError((_) => {});
      throw Exception(data['message'] ?? 'Failed to fetch users (Status ${response.statusCode})');
    }
  }

  /// Update a user's role.
  Future<Map<String, dynamic>> updateUserRole({
    required String id,
    required String newRole,
  }) async {
    final token = await _storageService.getToken();

    final response = await http.put(
      Uri.parse('$baseUrl/$id/role'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'newRole': newRole}),
    ).timeout(const Duration(seconds: 8));

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return data as Map<String, dynamic>;
    } else {
      throw Exception(data['message'] ?? 'Failed to update user role');
    }
  }
}
