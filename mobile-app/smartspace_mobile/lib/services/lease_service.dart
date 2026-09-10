import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/lease_model.dart';

class LeaseServiceException implements Exception {
  final String message;
  const LeaseServiceException(this.message);
  @override
  String toString() => message;
}

class LeaseService {
  final http.Client _client;
  final String? _customBaseUrl;

  LeaseService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _customBaseUrl = baseUrl;

  String get baseUrl {
    if (_customBaseUrl?.isNotEmpty == true) {
      return _customBaseUrl!;
    }
    if (kIsWeb) {
      return 'http://localhost:5030/api';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5030/api';
    }
    return 'http://localhost:5030/api';
  }

  Future<LeaseModel?> fetchMyActiveLease(String token) async {
    if (token.isEmpty) {
      throw const LeaseServiceException(
          'Your session has expired. Please sign in again.');
    }
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/leases/my-active'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token'
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 404) return null;
      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const LeaseServiceException(
            'Your session has expired or cannot access lease details.');
      }
      if (response.statusCode != 200) {
        throw LeaseServiceException(
            _messageFrom(response.body) ?? 'Unable to load lease details.');
      }

      final decoded = jsonDecode(response.body);
      if (decoded is! Map) {
        throw const LeaseServiceException(
            'The server returned an invalid lease response.');
      }
      return LeaseModel.fromJson(Map<String, dynamic>.from(decoded));
    } on SocketException {
      throw const LeaseServiceException(
          'Unable to reach SmartSpace. Check that the backend is running.');
    } on TimeoutException {
      throw const LeaseServiceException(
          'The lease request timed out. Please try again.');
    } on FormatException {
      throw const LeaseServiceException(
          'The server returned invalid lease data.');
    }
  }

  String? _messageFrom(String body) {
    try {
      final decoded = jsonDecode(body);
      return decoded is Map ? decoded['message']?.toString() : null;
    } catch (_) {
      return null;
    }
  }
}
