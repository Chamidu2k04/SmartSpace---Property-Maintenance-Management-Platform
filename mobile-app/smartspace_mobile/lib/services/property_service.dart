import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';
import '../models/property_model.dart';
import 'api_config.dart';
import 'storage_service.dart';

class PropertyService {
  final SecureStorageService _storage = SecureStorageService();
  static String get _url => '${ApiConfig.baseUrl}/properties';

  Future<List<PropertyModel>> getProperties() async {
    try {
      final response = await http
          .get(Uri.parse(_url), headers: await _headers())
          .timeout(const Duration(seconds: 15));
      if (response.statusCode != 200) {
        throw Exception(_message(response.body, 'Unable to load properties.'));
      }
      final data = jsonDecode(response.body) as List;
      return data
          .map((item) => PropertyModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    } on SocketException {
      throw Exception('Cannot connect to the SmartSpace server.');
    } on TimeoutException {
      throw Exception('Loading properties timed out. Please try again.');
    } on FormatException {
      throw Exception('The server returned an invalid property response.');
    }
  }

  Future<PropertyModel> createProperty({required String name, required String address, required String city, required String unitNumber, required int floor, XFile? image}) async {
    final token = await _storage.getToken();
    if (token == null || token.isEmpty) throw Exception('Please log in again.');
    final request = http.MultipartRequest('POST', Uri.parse(_url));
    request.headers['Authorization'] = 'Bearer $token';
    request.fields.addAll({
      'Name': name.trim(), 'Address': address.trim(), 'City': city.trim(),
      'InitialUnits[0].UnitNumber': unitNumber.trim(), 'InitialUnits[0].Floor': floor.toString(),
    });
    await _attachImage(request, image);
    return _send(request, successMessage: 'Unable to create property.');
  }

  Future<PropertyModel> updateProperty({
    required String id,
    required String name,
    required String address,
    required String city,
    XFile? image,
  }) async {
    final token = await _storage.getToken();
    if (token == null || token.isEmpty) throw Exception('Please log in again.');
    final request = http.MultipartRequest('PUT', Uri.parse('$_url/$id'));
    request.headers['Authorization'] = 'Bearer $token';
    request.fields.addAll({
      'Name': name.trim(),
      'Address': address.trim(),
      'City': city.trim(),
    });
    await _attachImage(request, image);
    return _send(request, successMessage: 'Unable to update property.');
  }

  Future<void> _attachImage(http.MultipartRequest request, XFile? image) async {
    if (image == null) return;
    final bytes = await image.readAsBytes();
    if (bytes.length > 10 * 1024 * 1024) {
      throw Exception('The property image must be 10 MB or smaller.');
    }
    final mimeType = lookupMimeType(image.name, headerBytes: bytes);
    if (mimeType == null || !mimeType.startsWith('image/')) {
      throw Exception('Please choose a valid image file.');
    }
    request.files.add(http.MultipartFile.fromBytes(
      'Image',
      bytes,
      filename: image.name,
      contentType: MediaType.parse(mimeType),
    ));
  }

  Future<PropertyModel> _send(
    http.MultipartRequest request, {
    required String successMessage,
  }) async {
    try {
      final response = await http.Response.fromStream(await request.send().timeout(const Duration(seconds: 30)));
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception(_message(response.body, successMessage));
      }
      return PropertyModel.fromJson(Map<String, dynamic>.from(jsonDecode(response.body) as Map));
    } on SocketException { throw Exception('Cannot connect to the SmartSpace server.'); }
    on TimeoutException { throw Exception('The property request timed out. Please try again.'); }
    on FormatException { throw Exception('The server returned an invalid property response.'); }
  }

  Future<Map<String, String>> _headers() async {
    final token = await _storage.getToken();
    if (token == null || token.isEmpty) throw Exception('Please log in again.');
    return {'Accept': 'application/json', 'Authorization': 'Bearer $token'};
  }

  String _message(String body, String fallback) {
    try { final value = jsonDecode(body); return value['message']?.toString() ?? fallback; } catch (_) { return fallback; }
  }
}
