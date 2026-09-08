import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/inventory_item.dart';
import '../models/supplier_model.dart';

/// Custom exceptions for granular and user-friendly error handling.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

class NotFoundException extends ApiException {
  NotFoundException([String message = 'The requested item was not found.'])
      : super(message, 404);
}

class UnauthorizedException extends ApiException {
  UnauthorizedException([String message = 'Session expired or unauthorized. Please log in again.'])
      : super(message, 401);
}

class NetworkException extends ApiException {
  NetworkException([super.message = 'Unable to connect to server. Check your network connection.']);
}

class InventoryService {
  final http.Client _client;
  final FlutterSecureStorage _secureStorage;
  final String? _customBaseUrl;

  static const String tokenKey = 'smartspace_jwt_token';

  InventoryService({
    http.Client? client,
    FlutterSecureStorage? secureStorage,
    String? baseUrl,
  })  : _client = client ?? http.Client(),
        _secureStorage = secureStorage ?? const FlutterSecureStorage(),
        _customBaseUrl = baseUrl;

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

  /// Retrieves the JWT authentication token from secure storage or shared prefs.
  Future<String?> _getToken() async {
    try {
      final token = await _secureStorage.read(key: tokenKey);
      if (token != null && token.isNotEmpty) return token;
    } catch (_) {
      // Fallback for web or desktop
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(tokenKey);
    } catch (_) {
      return null;
    }
  }

  /// Builds standard request headers with Authorization Bearer token.
  Future<Map<String, String>> _buildHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  // ==========================================
  // INVENTORY PARTS CRUD
  // ==========================================

  /// Fetches all inventory items: GET /api/inventory
  Future<List<InventoryItem>> fetchInventory() async {
    final uri = Uri.parse('$baseUrl/inventory');
    try {
      final headers = await _buildHeaders();
      final response = await _client
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 10));

      return _handleListResponse(response);
    } on SocketException {
      throw NetworkException('Network error: Unable to reach the server.');
    } on TimeoutException {
      throw NetworkException('Request timed out while loading parts.');
    } on FormatException {
      throw ApiException('Server returned an invalid response format.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('An unexpected error occurred: ${e.toString()}');
    }
  }

  /// Fetches a single inventory item by ID: GET /api/inventory/{id}
  Future<InventoryItem> fetchPartById(String id) async {
    final cleanId = id.trim();
    if (cleanId.isEmpty) {
      throw ApiException('Part ID cannot be empty.');
    }

    final uri = Uri.parse('$baseUrl/inventory/$cleanId');
    try {
      final headers = await _buildHeaders();
      final response = await _client
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 10));

      return _handleSingleItemResponse(response, cleanId);
    } on SocketException {
      throw NetworkException('Network error: Unable to reach the server.');
    } on TimeoutException {
      throw NetworkException('Request timed out while looking up the part.');
    } on FormatException {
      throw ApiException('Server returned an invalid response format.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('An unexpected error occurred: ${e.toString()}');
    }
  }

  /// Creates a new inventory item: POST /api/inventory
  Future<InventoryItem> createInventoryItem(Map<String, dynamic> dto) async {
    final uri = Uri.parse('$baseUrl/inventory');
    try {
      final headers = await _buildHeaders();
      final response = await _client
          .post(uri, headers: headers, body: jsonEncode(dto))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map) {
          final stringMap = <String, dynamic>{};
          decoded.forEach((k, v) => stringMap[k.toString()] = v);
          return InventoryItem.fromJson(stringMap);
        }
        throw ApiException('Unexpected response format when creating item.');
      } else {
        _handleErrorStatus(response, 'create spare part');
        throw ApiException('Failed to create spare part (Status ${response.statusCode})');
      }
    } on SocketException {
      throw NetworkException('Network error: Unable to reach the server.');
    } on TimeoutException {
      throw NetworkException('Request timed out while creating the part.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Error creating spare part: ${e.toString()}');
    }
  }

  /// Updates an existing inventory item: PUT /api/inventory/{id}
  Future<InventoryItem> updateInventoryItem(String id, Map<String, dynamic> dto) async {
    final cleanId = id.trim();
    final uri = Uri.parse('$baseUrl/inventory/$cleanId');
    try {
      final headers = await _buildHeaders();
      final response = await _client
          .put(uri, headers: headers, body: jsonEncode(dto))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map) {
          final stringMap = <String, dynamic>{};
          decoded.forEach((k, v) => stringMap[k.toString()] = v);
          return InventoryItem.fromJson(stringMap);
        }
        throw ApiException('Unexpected response format when updating item.');
      } else {
        _handleErrorStatus(response, 'update spare part');
        throw ApiException('Failed to update spare part (Status ${response.statusCode})');
      }
    } on SocketException {
      throw NetworkException('Network error: Unable to reach the server.');
    } on TimeoutException {
      throw NetworkException('Request timed out while updating the part.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Error updating spare part: ${e.toString()}');
    }
  }

  /// Deletes an inventory item: DELETE /api/inventory/{id}
  Future<void> deleteInventoryItem(String id) async {
    final cleanId = id.trim();
    final uri = Uri.parse('$baseUrl/inventory/$cleanId');
    try {
      final headers = await _buildHeaders();
      final response = await _client
          .delete(uri, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 204) {
        return;
      } else {
        _handleErrorStatus(response, 'delete spare part');
      }
    } on SocketException {
      throw NetworkException('Network error: Unable to reach the server.');
    } on TimeoutException {
      throw NetworkException('Request timed out while deleting the part.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Error deleting spare part: ${e.toString()}');
    }
  }

  // ==========================================
  // SUPPLIERS CRUD
  // ==========================================

  /// Fetches all suppliers: GET /api/suppliers
  Future<List<SupplierItem>> fetchSuppliers() async {
    final uri = Uri.parse('$baseUrl/suppliers');
    try {
      final headers = await _buildHeaders();
      final response = await _client
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 10));

      return _handleSupplierListResponse(response);
    } on SocketException {
      throw NetworkException('Network error: Unable to reach the server.');
    } on TimeoutException {
      throw NetworkException('Request timed out while loading suppliers.');
    } on FormatException {
      throw ApiException('Server returned an invalid response format.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('An unexpected error occurred: ${e.toString()}');
    }
  }

  /// Creates a new supplier: POST /api/suppliers
  Future<SupplierItem> createSupplier(Map<String, dynamic> dto) async {
    final uri = Uri.parse('$baseUrl/suppliers');
    try {
      final headers = await _buildHeaders();
      final response = await _client
          .post(uri, headers: headers, body: jsonEncode(dto))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map) {
          final stringMap = <String, dynamic>{};
          decoded.forEach((k, v) => stringMap[k.toString()] = v);
          return SupplierItem.fromJson(stringMap);
        }
        throw ApiException('Unexpected response format when creating supplier.');
      } else {
        _handleErrorStatus(response, 'create supplier');
        throw ApiException('Failed to create supplier (Status ${response.statusCode})');
      }
    } on SocketException {
      throw NetworkException('Network error: Unable to reach the server.');
    } on TimeoutException {
      throw NetworkException('Request timed out while creating supplier.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Error creating supplier: ${e.toString()}');
    }
  }

  /// Updates an existing supplier: PUT /api/suppliers/{id}
  Future<SupplierItem> updateSupplier(String id, Map<String, dynamic> dto) async {
    final cleanId = id.trim();
    final uri = Uri.parse('$baseUrl/suppliers/$cleanId');
    try {
      final headers = await _buildHeaders();
      final response = await _client
          .put(uri, headers: headers, body: jsonEncode(dto))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map) {
          final stringMap = <String, dynamic>{};
          decoded.forEach((k, v) => stringMap[k.toString()] = v);
          return SupplierItem.fromJson(stringMap);
        }
        throw ApiException('Unexpected response format when updating supplier.');
      } else {
        _handleErrorStatus(response, 'update supplier');
        throw ApiException('Failed to update supplier (Status ${response.statusCode})');
      }
    } on SocketException {
      throw NetworkException('Network error: Unable to reach the server.');
    } on TimeoutException {
      throw NetworkException('Request timed out while updating supplier.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Error updating supplier: ${e.toString()}');
    }
  }

  /// Deletes a supplier: DELETE /api/suppliers/{id}
  Future<void> deleteSupplier(String id) async {
    final cleanId = id.trim();
    final uri = Uri.parse('$baseUrl/suppliers/$cleanId');
    try {
      final headers = await _buildHeaders();
      final response = await _client
          .delete(uri, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 204) {
        return;
      } else {
        _handleErrorStatus(response, 'delete supplier');
      }
    } on SocketException {
      throw NetworkException('Network error: Unable to reach the server.');
    } on TimeoutException {
      throw NetworkException('Request timed out while deleting supplier.');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Error deleting supplier: ${e.toString()}');
    }
  }

  // ==========================================
  // RESPONSE PARSERS & ERROR HANDLERS
  // ==========================================

  void _handleErrorStatus(http.Response response, String actionName) {
    String? backendMessage;
    try {
      final body = jsonDecode(response.body);
      if (body is Map && body['message'] != null) {
        backendMessage = body['message'].toString();
      }
    } catch (_) {}

    if (response.statusCode == 400) {
      throw ApiException(backendMessage ?? 'Invalid data provided for $actionName.', 400);
    } else if (response.statusCode == 401 || response.statusCode == 403) {
      throw UnauthorizedException('Session expired or unauthorized to $actionName.');
    } else if (response.statusCode == 404) {
      throw NotFoundException(backendMessage ?? 'Record not found for $actionName.');
    } else {
      throw ApiException(
        backendMessage ?? 'Failed to $actionName (Status ${response.statusCode}).',
        response.statusCode,
      );
    }
  }

  List<InventoryItem> _handleListResponse(http.Response response) {
    if (response.statusCode == 200) {
      try {
        final decoded = jsonDecode(response.body);
        List<dynamic> list;

        if (decoded is List) {
          list = decoded;
        } else if (decoded is Map && decoded['data'] is List) {
          list = decoded['data'] as List<dynamic>;
        } else if (decoded is Map && decoded[r'$values'] is List) {
          list = decoded[r'$values'] as List<dynamic>;
        } else {
          throw ApiException('Unexpected data format received from server.');
        }

        return list.map((item) {
          if (item is Map) {
            final stringMap = <String, dynamic>{};
            item.forEach((k, v) {
              stringMap[k.toString()] = v;
            });
            return InventoryItem.fromJson(stringMap);
          }
          throw ApiException('Invalid part object format in list.');
        }).toList();
      } catch (e) {
        if (e is ApiException) rethrow;
        throw ApiException('Failed to parse inventory data: ${e.toString()}');
      }
    } else if (response.statusCode == 401 || response.statusCode == 403) {
      throw UnauthorizedException('Session expired or unauthorized to access inventory.');
    } else if (response.statusCode == 404) {
      throw NotFoundException('Inventory endpoint not found.');
    } else {
      throw ApiException('Failed to fetch inventory (Status ${response.statusCode})', response.statusCode);
    }
  }

  InventoryItem _handleSingleItemResponse(http.Response response, String partId) {
    if (response.statusCode == 200) {
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map) {
          final stringMap = <String, dynamic>{};
          decoded.forEach((k, v) {
            stringMap[k.toString()] = v;
          });
          return InventoryItem.fromJson(stringMap);
        } else {
          throw ApiException('Invalid part data received from server.');
        }
      } catch (e) {
        if (e is ApiException) rethrow;
        throw ApiException('Failed to parse part details: ${e.toString()}');
      }
    } else if (response.statusCode == 404) {
      throw NotFoundException('Part with ID "$partId" was not found in inventory.');
    } else if (response.statusCode == 401 || response.statusCode == 403) {
      throw UnauthorizedException('Unauthorized to view this inventory item.');
    } else {
      throw ApiException('Failed to retrieve part (Status ${response.statusCode})', response.statusCode);
    }
  }

  List<SupplierItem> _handleSupplierListResponse(http.Response response) {
    if (response.statusCode == 200) {
      try {
        final decoded = jsonDecode(response.body);
        List<dynamic> list;

        if (decoded is List) {
          list = decoded;
        } else if (decoded is Map && decoded['data'] is List) {
          list = decoded['data'] as List<dynamic>;
        } else if (decoded is Map && decoded[r'$values'] is List) {
          list = decoded[r'$values'] as List<dynamic>;
        } else {
          throw ApiException('Unexpected data format received from server.');
        }

        return list.map((item) {
          if (item is Map) {
            final stringMap = <String, dynamic>{};
            item.forEach((k, v) {
              stringMap[k.toString()] = v;
            });
            return SupplierItem.fromJson(stringMap);
          }
          throw ApiException('Invalid supplier object format in list.');
        }).toList();
      } catch (e) {
        if (e is ApiException) rethrow;
        throw ApiException('Failed to parse supplier data: ${e.toString()}');
      }
    } else if (response.statusCode == 401 || response.statusCode == 403) {
      throw UnauthorizedException('Session expired or unauthorized to access suppliers.');
    } else if (response.statusCode == 404) {
      throw NotFoundException('Suppliers endpoint not found.');
    } else {
      throw ApiException('Failed to fetch suppliers (Status ${response.statusCode})', response.statusCode);
    }
  }
}
