import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final SecureStorageService _storageService = SecureStorageService();

  UserModel? _user;
  String? _token;
  bool _isLoading = false;
  bool _isCheckingAuth = true;
  String? _errorMessage;

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
      final data = await _authService.login(email: email, password: password);

      _token = data['token'];
      final userData = data['user'] is Map<String, dynamic> ? data['user'] : data;
      _user = UserModel.fromJson({
        'id': userData['id']?.toString() ?? '',
        'email': userData['email'] ?? '',
        'fullName': userData['fullName'] ?? '',
        'role': userData['role'] ?? 'Tenant',
      });

      await _storageService.saveSession(
        token: _token!,
        id: _user!.id,
        email: _user!.email,
        name: _user!.fullName,
        role: userData['role']?.toString() ?? 'Tenant',
      );

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      // Viva / Offline test mode: allow seamless demo login if local dev server isn't active
      if (email == 'admin@smartspace.com' && password == 'Password123!') {
        return _mockLogin('00000000-0000-0000-0000-000000000000', email, 'System Admin', 'Admin');
      } else if (email == 'tenant@smartspace.com' && password == 'Password123!') {
        return _mockLogin('11111111-1111-1111-1111-111111111111', email, 'John Tenant', 'Tenant');
      } else if (email == 'technician@smartspace.com' && password == 'Password123!') {
        return _mockLogin('33333333-3333-3333-3333-333333333333', email, 'Alex Technician', 'Technician');
      } else if ((email == 'inventory@mail.com' || email == 'inventory@smartspace.com') && password == 'Password123!') {
        return _mockLogin('44444444-4444-4444-4444-444444444444', email, 'Saman Kumara', 'InventoryOfficer');
      }

      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String fullName, String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final data = await _authService.register(
        fullName: fullName,
        email: email,
        password: password,
      );

      _token = data['token'];
      final userData = data['user'] is Map<String, dynamic> ? data['user'] : data;
      _user = UserModel.fromJson({
        'id': userData['id']?.toString() ?? '',
        'email': userData['email'] ?? '',
        'fullName': userData['fullName'] ?? '',
        'role': userData['role'] ?? 'Tenant',
      });

      await _storageService.saveSession(
        token: _token!,
        id: _user!.id,
        email: _user!.email,
        name: _user!.fullName,
        role: userData['role']?.toString() ?? 'Tenant',
      );

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
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
