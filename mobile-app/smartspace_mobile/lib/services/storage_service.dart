import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const String _keyToken = 'smartspace_jwt_token';
  static const String _keyUserEmail = 'smartspace_user_email';
  static const String _keyUserName = 'smartspace_user_name';
  static const String _keyUserRole = 'smartspace_user_role';
  static const String _keyUserId = 'smartspace_user_id';

  Future<void> saveSession({
    required String token,
    required String id,
    required String email,
    required String name,
    required String role,
  }) async {
    await _storage.write(key: _keyToken, value: token);
    await _storage.write(key: _keyUserId, value: id);
    await _storage.write(key: _keyUserEmail, value: email);
    await _storage.write(key: _keyUserName, value: name);
    await _storage.write(key: _keyUserRole, value: role);

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyToken, token);
      await prefs.setString(_keyUserId, id);
      await prefs.setString(_keyUserEmail, email);
      await prefs.setString(_keyUserName, name);
      await prefs.setString(_keyUserRole, role);
    } catch (_) {}
  }

  Future<String?> getToken() async {
    try {
      final token = await _storage.read(key: _keyToken);
      if (token != null && token.isNotEmpty) return token;
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_keyToken);
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, String>?> getUser() async {
    final token = await getToken();
    if (token == null || token.isEmpty) return null;

    String id = '';
    String email = '';
    String fullName = '';
    String role = 'Tenant';

    try {
      id = await _storage.read(key: _keyUserId) ?? '';
      email = await _storage.read(key: _keyUserEmail) ?? '';
      fullName = await _storage.read(key: _keyUserName) ?? '';
      role = await _storage.read(key: _keyUserRole) ?? 'Tenant';
    } catch (_) {}

    if (id.isEmpty) {
      try {
        final prefs = await SharedPreferences.getInstance();
        id = prefs.getString(_keyUserId) ?? '';
        email = prefs.getString(_keyUserEmail) ?? '';
        fullName = prefs.getString(_keyUserName) ?? '';
        role = prefs.getString(_keyUserRole) ?? 'Tenant';
      } catch (_) {}
    }

    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'role': role,
    };
  }

  Future<void> clearSession() async {
    try {
      await _storage.delete(key: _keyToken);
      await _storage.delete(key: _keyUserId);
      await _storage.delete(key: _keyUserEmail);
      await _storage.delete(key: _keyUserName);
      await _storage.delete(key: _keyUserRole);
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyToken);
      await prefs.remove(_keyUserId);
      await prefs.remove(_keyUserEmail);
      await prefs.remove(_keyUserName);
      await prefs.remove(_keyUserRole);
    } catch (_) {}
  }
}
