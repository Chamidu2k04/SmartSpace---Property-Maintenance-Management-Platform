import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageService {
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
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, token);
    await prefs.setString(_keyUserId, id);
    await prefs.setString(_keyUserEmail, email);
    await prefs.setString(_keyUserName, name);
    await prefs.setString(_keyUserRole, role);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  Future<Map<String, String>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_keyToken);
    if (token == null) return null;

    return {
      'id': prefs.getString(_keyUserId) ?? '',
      'email': prefs.getString(_keyUserEmail) ?? '',
      'fullName': prefs.getString(_keyUserName) ?? '',
      'role': prefs.getString(_keyUserRole) ?? 'Tenant',
    };
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
    await prefs.remove(_keyUserId);
    await prefs.remove(_keyUserEmail);
    await prefs.remove(_keyUserName);
    await prefs.remove(_keyUserRole);
  }
}
