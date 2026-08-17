import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import '../services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  final SecureStorageService _storageService = SecureStorageService();

  UserModel? _user;
  String? _token;
  bool _isLoading = false;
  bool _isCheckingAuth = true;
  String? _errorMessage;

  static const String _baseUrl = 'http://10.0.2.2:5000/api/auth';

  UserModel? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isCheckingAuth => _isCheckingAuth;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    tryRestoreSession();
  }

  Future<void> tryRestoreSession() async {
    _isCheckingAuth = true;
    notifyListeners();

    try {
      final savedToken = await _storageService.getToken();
      final userData = await _storageService.getUser();

      if (savedToken != null && userData != null) {
        _token = savedToken;
        _user = UserModel.fromJson(userData);
      }
    } catch (e) {
      debugPrint('Error restoring session: $e');
    } finally {
      _isCheckingAuth = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 4));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        _token = data['token'];
        _user = UserModel.fromJson({
          'id': data['id'],
          'email': data['email'],
          'fullName': data['fullName'],
          'role': data['role'],
        });

        await _storageService.saveSession(
          token: _token!,
          id: _user!.id,
          email: _user!.email,
          name: _user!.fullName,
          role: data['role'],
        );

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = data['message'] ?? 'Login failed. Please check credentials.';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      // Viva / Offline test mode: allow seamless demo login if local dev server isn't active
      if (email == 'tenant@smartspace.com' && password == 'Password123!') {
        return _mockLogin('11111111-1111-1111-1111-111111111111', email, 'John Tenant', 'Tenant');
      } else if (email == 'technician@smartspace.com' && password == 'Password123!') {
        return _mockLogin('33333333-3333-3333-3333-333333333333', email, 'Alex Technician', 'Technician');
      }

      _errorMessage = 'Could not connect to server. Please check backend host.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> _mockLogin(String id, String email, String name, String role) async {
    _token = 'demo_jwt_token_for_smartspace_mobile';
    _user = UserModel.fromJson({
      'id': id,
      'email': email,
      'fullName': name,
      'role': role,
    });

    await _storageService.saveSession(
      token: _token!,
      id: id,
      email: email,
      name: name,
      role: role,
    );

    _isLoading = false;
    _errorMessage = null;
    notifyListeners();
    return true;
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    await _storageService.clearSession();
    notifyListeners();
  }
}
