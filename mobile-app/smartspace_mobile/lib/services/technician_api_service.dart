import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/technician_models.dart';

/// Custom API Exceptions
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

class UnauthorizedException extends ApiException {
  UnauthorizedException([String message = 'Session expired or unauthorized. Please log in again.'])
      : super(message, 401);
}

class NotFoundException extends ApiException {
  NotFoundException([String message = 'The requested resource was not found.'])
      : super(message, 404);
}

class NetworkException extends ApiException {
  NetworkException([super.message = 'Unable to connect to server. Check your network connection.']);
}

/// Service handling API interactions for Technician Scheduling & Quotations module.
class TechnicianApiService {
  final http.Client _client;
  final FlutterSecureStorage _secureStorage;
  final String? _customBaseUrl;

  static const String tokenKey = 'smartspace_jwt_token';

  TechnicianApiService({
    http.Client? client,
    FlutterSecureStorage? secureStorage,
    String? baseUrl,
  })  : _client = client ?? http.Client(),
        _secureStorage = secureStorage ?? const FlutterSecureStorage(),
        _customBaseUrl = baseUrl;

  /// Base URL matching ASP.NET Core API (Port 5030)
  String get baseUrl {
    final custom = _customBaseUrl;
    if (custom != null && custom.isNotEmpty) {
      return custom;
    }
    if (kIsWeb) {
      return 'http://localhost:5030/api';
    } else if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5030/api';
    } else {
      return 'http://localhost:5030/api';
    }
  }

  /// Read JWT Token from FlutterSecureStorage with SharedPreferences fallback.
  Future<String?> _getToken() async {
    try {
      final token = await _secureStorage.read(key: tokenKey);
      if (token != null && token.isNotEmpty) return token;
    } catch (_) {
      // Fallback for non-mobile platforms
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(tokenKey);
    } catch (_) {
      return null;
    }
  }

  /// Helper to construct JSON headers with Bearer authorization
  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Handle and throw appropriate API exceptions based on HTTP response
  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      try {
        return json.decode(response.body);
      } catch (_) {
        return response.body;
      }
    }

    String errorMessage = 'Request failed with status code ${response.statusCode}';
    try {
      final errorJson = json.decode(response.body);
      if (errorJson is Map && errorJson.containsKey('message')) {
        errorMessage = errorJson['message'];
      }
    } catch (_) {}

    switch (response.statusCode) {
      case 401:
        throw UnauthorizedException(errorMessage);
      case 403:
        throw ApiException('Access forbidden: $errorMessage', 403);
      case 404:
        throw NotFoundException(errorMessage);
      case 400:
        throw ApiException('Bad Request: $errorMessage', 400);
      default:
        throw ApiException(errorMessage, response.statusCode);
    }
  }

  // ---------------------------------------------------------------------------
  // TECHNICIAN PROFILES ENDPOINTS
  // ---------------------------------------------------------------------------

  /// Fetch all technician profiles (GET /api/technicians)
  Future<List<TechnicianProfile>> fetchTechnicians() async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .get(Uri.parse('$baseUrl/technicians'), headers: headers)
          .timeout(const Duration(seconds: 15));

      final data = _handleResponse(response);
      if (data is List) {
        return data.map((json) => TechnicianProfile.fromJson(json)).toList();
      }
      return [];
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  /// Fetch technician profile by ID (GET /api/technicians/{id})
  Future<TechnicianProfile?> fetchTechnicianById(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .get(Uri.parse('$baseUrl/technicians/$id'), headers: headers)
          .timeout(const Duration(seconds: 15));

      final data = _handleResponse(response);
      if (data != null) {
        return TechnicianProfile.fromJson(data);
      }
      return null;
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  /// Update technician profile (PUT /api/technicians/{id})
  Future<TechnicianProfile> updateTechnicianProfile(
      String id, Map<String, dynamic> data) async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .put(
            Uri.parse('$baseUrl/technicians/$id'),
            headers: headers,
            body: json.encode(data),
          )
          .timeout(const Duration(seconds: 15));

      final result = _handleResponse(response);
      return TechnicianProfile.fromJson(result);
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  /// Create a new technician profile (POST /api/technicians)
  Future<TechnicianProfile> createTechnicianProfile(
      Map<String, dynamic> data) async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .post(
            Uri.parse('$baseUrl/technicians'),
            headers: headers,
            body: json.encode(data),
          )
          .timeout(const Duration(seconds: 15));

      final result = _handleResponse(response);
      return TechnicianProfile.fromJson(result);
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  /// Delete / Deactivate technician profile (DELETE /api/technicians/{id})
  Future<bool> deleteTechnicianProfile(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .delete(
            Uri.parse('$baseUrl/technicians/$id'),
            headers: headers,
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return true;
      }
      _handleResponse(response);
      return true;
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  // ---------------------------------------------------------------------------
  // APPOINTMENTS ENDPOINTS (FR9)
  // ---------------------------------------------------------------------------

  /// Fetch all scheduled appointments (GET /api/appointments)
  Future<List<Appointment>> fetchAppointments() async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .get(Uri.parse('$baseUrl/appointments'), headers: headers)
          .timeout(const Duration(seconds: 15));

      final data = _handleResponse(response);
      if (data is List) {
        return data.map((json) => Appointment.fromJson(json)).toList();
      }
      return [];
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  /// Fetch appointments for a specific technician (GET /api/appointments/technician/{technicianId})
  Future<List<Appointment>> fetchMyAppointments(String technicianId) async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .get(
            Uri.parse('$baseUrl/appointments/technician/$technicianId'),
            headers: headers,
          )
          .timeout(const Duration(seconds: 15));

      final data = _handleResponse(response);
      if (data is List) {
        return data.map((json) => Appointment.fromJson(json)).toList();
      }
      return [];
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  /// Create a new maintenance appointment (POST /api/appointments)
  Future<Appointment> createAppointment(Map<String, dynamic> data) async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .post(
            Uri.parse('$baseUrl/appointments'),
            headers: headers,
            body: json.encode(data),
          )
          .timeout(const Duration(seconds: 15));

      final result = _handleResponse(response);
      return Appointment.fromJson(result);
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  /// Update appointment status / schedule (PUT /api/appointments/{id}/schedule or /cancel)
  Future<Appointment?> updateAppointmentStatus(
    String id,
    String status, {
    Appointment? appointment,
  }) async {
    try {
      final headers = await _getHeaders();
      if (status == 'Cancelled') {
        final response = await _client
            .put(
              Uri.parse('$baseUrl/appointments/$id/cancel'),
              headers: headers,
            )
            .timeout(const Duration(seconds: 15));

        final result = _handleResponse(response);
        if (result != null) {
          return Appointment.fromJson(result);
        }
      } else if (appointment != null) {
        final payload = {
          'scheduledDate': appointment.scheduledDate,
          'startTime': appointment.startTime,
          'endTime': appointment.endTime,
          'status': status,
        };
        final response = await _client
            .put(
              Uri.parse('$baseUrl/appointments/$id/schedule'),
              headers: headers,
              body: json.encode(payload),
            )
            .timeout(const Duration(seconds: 15));

        final result = _handleResponse(response);
        if (result != null) {
          return Appointment.fromJson(result);
        }
      }
      return null;
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  /// Update full appointment schedule & technician details (PUT /api/appointments/{id}/schedule)
  Future<Appointment?> updateAppointmentSchedule(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .put(
            Uri.parse('$baseUrl/appointments/$id/schedule'),
            headers: headers,
            body: json.encode(payload),
          )
          .timeout(const Duration(seconds: 15));

      final result = _handleResponse(response);
      if (result != null) {
        return Appointment.fromJson(result);
      }
      return null;
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  // ---------------------------------------------------------------------------
  // QUOTATIONS ENDPOINTS (FR10)
  // ---------------------------------------------------------------------------

  /// Fetch all cost quotations (GET /api/quotations)
  Future<List<Quotation>> fetchQuotations() async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .get(Uri.parse('$baseUrl/quotations'), headers: headers)
          .timeout(const Duration(seconds: 15));

      final data = _handleResponse(response);
      if (data is List) {
        return data.map((json) => Quotation.fromJson(json)).toList();
      }
      return [];
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  /// Approve a quotation by ID (POST /api/quotations/{id}/approve)
  /// Restricted to authenticated Property Managers.
  Future<Quotation> approveQuotation(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .post(
            Uri.parse('$baseUrl/quotations/$id/approve'),
            headers: headers,
          )
          .timeout(const Duration(seconds: 15));

      final result = _handleResponse(response);
      return Quotation.fromJson(result);
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  /// Create a new cost quotation (POST /api/quotations)
  Future<Quotation> createQuotation(Map<String, dynamic> data) async {
    try {
      final headers = await _getHeaders();
      final payload = {
        'ticketId': data['ticketId'],
        'laborCost': double.parse(data['laborCost'].toString()),
        'partsCost': double.parse(data['partsCost'].toString()),
      };
      final response = await _client
          .post(
            Uri.parse('$baseUrl/quotations'),
            headers: headers,
            body: json.encode(payload),
          )
          .timeout(const Duration(seconds: 15));

      final result = _handleResponse(response);
      return Quotation.fromJson(result);
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }

  // ---------------------------------------------------------------------------
  // TICKETS ENDPOINT
  // ---------------------------------------------------------------------------

  /// Fetch all maintenance tickets (GET /api/tickets)
  Future<List<MaintenanceTicket>> fetchTickets() async {
    try {
      final headers = await _getHeaders();
      final response = await _client
          .get(Uri.parse('$baseUrl/tickets'), headers: headers)
          .timeout(const Duration(seconds: 15));

      final data = _handleResponse(response);
      if (data is List) {
        return data.map((json) => MaintenanceTicket.fromJson(json)).toList();
      }
      return [];
    } on SocketException catch (_) {
      throw NetworkException();
    } on TimeoutException catch (_) {
      throw NetworkException('Request timed out. Please try again.');
    }
  }
}
