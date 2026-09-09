import 'package:flutter_secure_storage/flutter_secure_storage.dart';

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
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _keyToken);
  }

  Future<Map<String, String>?> getUser() async {
    final token = await _storage.read(key: _keyToken);
    if (token == null) return null;

    final id = await _storage.read(key: _keyUserId) ?? '';
    final email = await _storage.read(key: _keyUserEmail) ?? '';
    final fullName = await _storage.read(key: _keyUserName) ?? '';
    final role = await _storage.read(key: _keyUserRole) ?? 'Tenant';

    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'role': role,
    };
  }

  Future<void> clearSession() async {
    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyUserId);
    await _storage.delete(key: _keyUserEmail);
    await _storage.delete(key: _keyUserName);
    await _storage.delete(key: _keyUserRole);
  }
}
