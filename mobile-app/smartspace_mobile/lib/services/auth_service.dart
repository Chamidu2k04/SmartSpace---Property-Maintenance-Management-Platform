import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';

class AuthService {
  static String get baseUrl => ApiConfig.authUrl;

  /// Register a new user. The backend strictly defaults the role to 'Tenant'.
  Future<Map<String, dynamic>> register({
    required String fullName,
    required String email,
    required String password,
  }) async {
    final url = Uri.parse('$baseUrl/register');
    final response = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'fullName': fullName.trim(),
            'email': email.trim(),
            'password': password,
          }),
        )
        .timeout(const Duration(seconds: 45));

    final data = jsonDecode(response.body);

    if (response.statusCode == 201 || response.statusCode == 200) {
      return data as Map<String, dynamic>;
    } else {
      throw Exception(data['message'] ?? 'Registration failed. (Status ${response.statusCode})');
    }
  }

  /// Authenticate credentials and return JWT token payload.
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final url = Uri.parse('$baseUrl/login');
    final response = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email.trim(),
            'password': password,
          }),
        )
        .timeout(const Duration(seconds: 45));

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return data as Map<String, dynamic>;
    } else {
      throw Exception(data['message'] ?? 'Invalid email or password.');
    }
  }
}
