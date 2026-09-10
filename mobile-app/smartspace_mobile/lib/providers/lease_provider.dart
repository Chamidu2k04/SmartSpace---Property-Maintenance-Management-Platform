import 'package:flutter/foundation.dart';
import '../models/lease_model.dart';
import '../services/lease_service.dart';

class LeaseProvider extends ChangeNotifier {
  final LeaseService _service;
  LeaseModel? _activeLease;
  bool _isLoading = false;
  String? _errorMessage;

  LeaseProvider({LeaseService? service}) : _service = service ?? LeaseService();

  LeaseModel? get activeLease => _activeLease;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadActiveLease(String token) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _activeLease = await _service.fetchMyActiveLease(token);
    } on LeaseServiceException catch (error) {
      _activeLease = null;
      _errorMessage = error.message;
    } catch (_) {
      _activeLease = null;
      _errorMessage = 'An unexpected error occurred while loading your lease.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clear() {
    _activeLease = null;
    _errorMessage = null;
    notifyListeners();
  }
}
