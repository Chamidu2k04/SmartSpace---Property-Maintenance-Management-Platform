import "dart:io" show Platform;
import "package:flutter/foundation.dart" show kIsWeb;

/// Centralized API Configuration for SmartSpace Mobile App
/// Supports:
/// 1. Compile-time --dart-define=API_URL=... (recommended in CI/CD)
/// 2. Automatic platform-aware localhost mapping (10.0.2.2 for Android emulators, localhost for Web/iOS)
class ApiConfig {
  static const String _envBaseUrl = String.fromEnvironment("API_URL", defaultValue: "");

  static String get baseUrl {
    if (_envBaseUrl.isNotEmpty) {
      return _envBaseUrl;
    }
    if (kIsWeb) {
      return "http://localhost:5030/api";
    }
    try {
      if (Platform.isAndroid) {
        return "http://10.0.2.2:5030/api";
      }
    } catch (_) {}
    return "http://localhost:5030/api";
  }

  static String get authUrl => "$baseUrl/auth";
  static String get usersUrl => "$baseUrl/users";
  static String get ticketsUrl => baseUrl;

  /// Backend proxy URL for Inventory AI assistant (safest for mobile, avoiding port/network issues)
  static String get aiProxyUrl => "$baseUrl/inventory/ai-chat";

  /// Dedicated base URL for direct communication with SmartSpace Python AI Service (Port 8000)
  static String get aiBaseUrl {
    if (_envBaseUrl.isNotEmpty) {
      try {
        final uri = Uri.parse(_envBaseUrl);
        return "${uri.scheme}://${uri.host}:8000/api";
      } catch (_) {}
    }
    if (kIsWeb) {
      return "http://localhost:8000/api";
    }
    try {
      if (Platform.isAndroid) {
        return "http://10.0.2.2:8000/api";
      }
    } catch (_) {}
    return "http://localhost:8000/api";
  }
}

