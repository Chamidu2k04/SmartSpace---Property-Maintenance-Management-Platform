import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../models/ticket_model.dart';
import 'storage_service.dart';

class TicketServiceException implements Exception {
  final String message;
  const TicketServiceException(this.message);
  @override
  String toString() => message;
}

class TicketService {
  final http.Client _client;
  final SecureStorageService _storageService;

  TicketService({http.Client? client, SecureStorageService? storageService})
      : _client = client ?? http.Client(),
        _storageService = storageService ?? SecureStorageService();

  static String get serverBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:5030';
    } else if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5030';
    } else {
      return 'http://localhost:5030';
    }
  }

  static String get baseUrl => '$serverBaseUrl/api/tickets';

  /// Helper to convert relative image paths (e.g. `/uploads/tickets/...`) to full HTTP URLs.
  static String getFullImageUrl(String? pathOrUrl) {
    if (pathOrUrl == null || pathOrUrl.isEmpty) return '';
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    final cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : '/$pathOrUrl';
    return '$serverBaseUrl$cleanPath';
  }

  /// Fetch all maintenance tickets submitted by the authenticated tenant.
  Future<List<Ticket>> getMyTickets() async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const TicketServiceException('Authentication token not found. Please log in again.');
    }

    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/my-tickets'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const TicketServiceException('Your session has expired. Please log in again.');
      }
      if (response.statusCode != 200) {
        throw TicketServiceException(_extractMessage(response.body) ?? 'Failed to load maintenance requests.');
      }

      final List<dynamic> jsonList = jsonDecode(response.body);
      return jsonList.map((e) => Ticket.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    } on SocketException {
      throw const TicketServiceException('Cannot connect to SmartSpace server. Check your network or backend.');
    } on TimeoutException {
      throw const TicketServiceException('Connection timed out while fetching maintenance requests.');
    }
  }

  /// Fetch all maintenance tickets (PropertyManager only).
  Future<List<Ticket>> getAllTickets() async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const TicketServiceException('Authentication token not found. Please log in again.');
    }

    try {
      final response = await _client.get(
        Uri.parse(baseUrl),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const TicketServiceException('Your session has expired or you do not have permission.');
      }
      if (response.statusCode != 200) {
        throw TicketServiceException(_extractMessage(response.body) ?? 'Failed to load tickets.');
      }

      final List<dynamic> jsonList = jsonDecode(response.body);
      return jsonList.map((e) => Ticket.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    } on SocketException {
      throw const TicketServiceException('Cannot connect to SmartSpace server. Check your network or backend.');
    } on TimeoutException {
      throw const TicketServiceException('Connection timed out while fetching tickets.');
    }
  }

  /// Update the status of a ticket (PropertyManager only).
  Future<void> updateTicketStatus(String ticketId, String newStatus) async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const TicketServiceException('Authentication token not found. Please log in again.');
    }

    // Map the status string to its integer value for the API
    final statusIntMap = {
      'Submitted': 0,
      'Analyzing': 1,
      'PendingApproval': 2,
      'Scheduled': 3,
      'Completed': 4,
    };
    final statusValue = statusIntMap[newStatus] ?? 0;

    try {
      final response = await _client.patch(
        Uri.parse('$baseUrl/$ticketId/status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'status': statusValue}),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode != 204 && response.statusCode != 200) {
        throw TicketServiceException(
          _extractMessage(response.body) ?? 'Failed to update ticket status.',
        );
      }
    } on SocketException {
      throw const TicketServiceException('Cannot connect to SmartSpace server.');
    } on TimeoutException {
      throw const TicketServiceException('Update timed out. Please try again.');
    }
  }

  /// Delete a ticket (PropertyManager only).
  Future<void> deleteTicket(String ticketId) async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const TicketServiceException('Authentication token not found. Please log in again.');
    }
    try {
      final response = await _client.delete(
        Uri.parse('$baseUrl/$ticketId'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));
      if (response.statusCode != 204 && response.statusCode != 200) {
        throw TicketServiceException(
          _extractMessage(response.body) ?? 'Failed to delete ticket.',
        );
      }
    } on SocketException {
      throw const TicketServiceException('Cannot connect to SmartSpace server.');
    } on TimeoutException {
      throw const TicketServiceException('Delete timed out. Please try again.');
    }
  }

  /// Fetch detailed information for a single ticket by ID.
  Future<Ticket> getTicketById(String id) async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const TicketServiceException('Authentication token not found. Please log in again.');
    }

    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/$id'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 404) {
        throw const TicketServiceException('Maintenance ticket not found.');
      }
      if (response.statusCode != 200) {
        throw TicketServiceException(_extractMessage(response.body) ?? 'Failed to load ticket details.');
      }

      final decoded = jsonDecode(response.body);
      return Ticket.fromJson(Map<String, dynamic>.from(decoded as Map));
    } on SocketException {
      throw const TicketServiceException('Cannot connect to SmartSpace server.');
    } on TimeoutException {
      throw const TicketServiceException('Connection timed out.');
    }
  }

  /// Submit a new maintenance ticket with optional photo attachments.
  Future<Ticket> createTicket({
    required String unitId,
    required String description,
    required TicketUrgency urgencyLevel,
    List<XFile>? imageFiles,
  }) async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const TicketServiceException('Authentication token not found. Please log in again.');
    }

    try {
      final uri = Uri.parse(baseUrl);
      final request = http.MultipartRequest('POST', uri);

      request.headers['Authorization'] = 'Bearer $token';
      request.fields['UnitId'] = unitId;
      request.fields['Description'] = description.trim();
      request.fields['UrgencyLevel'] = urgencyLevel.toApiInt().toString();

      // Attach image files if provided
      if (imageFiles != null && imageFiles.isNotEmpty) {
        for (var i = 0; i < imageFiles.length; i++) {
          final file = imageFiles[i];
          final bytes = await file.readAsBytes();
          final multipartFile = http.MultipartFile.fromBytes(
            'Images',
            bytes,
            filename: file.name.isNotEmpty ? file.name : 'photo_$i.jpg',
          );
          request.files.add(multipartFile);
        }
      }

      final streamedResponse = await request.send().timeout(const Duration(seconds: 25));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 201 || response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        return Ticket.fromJson(Map<String, dynamic>.from(decoded as Map));
      } else {
        throw TicketServiceException(
            _extractMessage(response.body) ?? 'Failed to submit ticket. (Status ${response.statusCode})');
      }
    } on SocketException {
      throw const TicketServiceException('Cannot connect to SmartSpace server.');
    } on TimeoutException {
      throw const TicketServiceException('Upload timed out. Please try again.');
    }
  }

  /// Update an existing maintenance ticket (Description and Urgency).
  Future<void> updateTicket({
    required String ticketId,
    required String description,
    required TicketUrgency urgencyLevel,
  }) async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const TicketServiceException('Authentication token not found. Please log in again.');
    }

    try {
      final response = await _client.put(
        Uri.parse('$baseUrl/$ticketId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'description': description.trim(),
          'urgencyLevel': urgencyLevel.toApiInt(),
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode != 204 && response.statusCode != 200) {
        throw TicketServiceException(
          _extractMessage(response.body) ?? 'Failed to update ticket.',
        );
      }
    } on SocketException {
      throw const TicketServiceException('Cannot connect to SmartSpace server.');
    } on TimeoutException {
      throw const TicketServiceException('Update timed out. Please try again.');
    }
  }

  String? _extractMessage(String responseBody) {
    try {
      final decoded = jsonDecode(responseBody);
      if (decoded is Map && decoded.containsKey('message')) {
        return decoded['message']?.toString();
      }
    } catch (_) {}
    return null;
  }
}
