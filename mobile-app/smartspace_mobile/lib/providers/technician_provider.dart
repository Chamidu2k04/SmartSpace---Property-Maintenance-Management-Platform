import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/technician_models.dart';
import '../services/technician_api_service.dart';

/// State Management Provider for Technician Scheduling & Quotations module.
class TechnicianProvider extends ChangeNotifier {
  final TechnicianApiService _apiService;
  final FlutterSecureStorage _secureStorage;

  TechnicianProvider({
    TechnicianApiService? apiService,
    FlutterSecureStorage? secureStorage,
  })  : _apiService = apiService ?? TechnicianApiService(),
        _secureStorage = secureStorage ?? const FlutterSecureStorage();

  // State Lists
  List<TechnicianProfile> _technicians = [];
  List<Appointment> _appointments = [];
  List<Quotation> _quotations = [];
  List<MaintenanceTicket> _tickets = [];

  // Active User Info
  String _userRole = 'PropertyManager';
  String _userId = '';
  String _userEmail = '';

  // UI States
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  // Filter States
  String _selectedStatusFilter = 'All';
  String _selectedSpecialtyFilter = 'All';

  // Getters
  List<TechnicianProfile> get technicians => _technicians;
  List<Appointment> get appointments => _appointments;
  List<Quotation> get quotations => _quotations;
  List<MaintenanceTicket> get tickets => _tickets;
  String get userRole => _userRole;
  String get userId => _userId;
  String get userEmail => _userEmail;
  bool get isPropertyManager => _userRole.toLowerCase() == 'propertymanager';
  bool get isTechnician => _userRole.toLowerCase() == 'technician';
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;
  String get selectedStatusFilter => _selectedStatusFilter;
  String get selectedSpecialtyFilter => _selectedSpecialtyFilter;

  /// Initialize user session context read-only from secure storage or shared prefs
  Future<void> initSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _userRole = prefs.getString('smartspace_user_role') ?? 'PropertyManager';
      _userId = prefs.getString('smartspace_user_id') ?? '';
      _userEmail = prefs.getString('smartspace_user_email') ?? '';
    } catch (_) {
      try {
        _userRole = await _secureStorage.read(key: 'smartspace_user_role') ?? 'PropertyManager';
        _userId = await _secureStorage.read(key: 'smartspace_user_id') ?? '';
        _userEmail = await _secureStorage.read(key: 'smartspace_user_email') ?? '';
      } catch (_) {}
    }
    notifyListeners();
  }

  /// Filtered list of appointments based on status chip selection
  List<Appointment> get filteredAppointments {
    if (_selectedStatusFilter == 'All') return _appointments;
    return _appointments.where((a) {
      return a.status.toLowerCase() == _selectedStatusFilter.toLowerCase();
    }).toList();
  }

  /// Filtered list of appointments for a specific technician profile ID
  List<Appointment> getAppointmentsForTechnician(String technicianId) {
    return _appointments.where((a) => a.technicianId == technicianId).toList();
  }

  /// Filtered list of technician profiles based on specialty filter
  List<TechnicianProfile> get filteredTechnicians {
    if (_selectedSpecialtyFilter == 'All') return _technicians;
    return _technicians.where((t) {
      return t.tradeSpecialty.toLowerCase() == _selectedSpecialtyFilter.toLowerCase();
    }).toList();
  }

  void setStatusFilter(String filter) {
    _selectedStatusFilter = filter;
    notifyListeners();
  }

  void setSpecialtyFilter(String filter) {
    _selectedSpecialtyFilter = filter;
    notifyListeners();
  }

  void clearMessages() {
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // DATA LOADING ACTIONS
  // ---------------------------------------------------------------------------

  /// Load all data required for the scheduling module
  Future<void> loadAllData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await initSession();
      final results = await Future.wait([
        _apiService.fetchTechnicians().catchError((_) => <TechnicianProfile>[]),
        _apiService.fetchAppointments().catchError((_) => <Appointment>[]),
        _apiService.fetchQuotations().catchError((_) => <Quotation>[]),
        _apiService.fetchTickets().catchError((_) => <MaintenanceTicket>[]),
      ]);

      _technicians = results[0] as List<TechnicianProfile>;
      _appointments = results[1] as List<Appointment>;
      _quotations = results[2] as List<Quotation>;
      _tickets = results[3] as List<MaintenanceTicket>;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch technicians list
  Future<void> loadTechnicians() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _technicians = await _apiService.fetchTechnicians();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch tickets list
  Future<void> loadTickets() async {
    try {
      _tickets = await _apiService.fetchTickets();
      notifyListeners();
    } catch (_) {}
  }

  /// Fetch appointments list
  Future<void> loadAppointments() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _apiService.fetchAppointments().catchError((_) => <Appointment>[]),
        _apiService.fetchTickets().catchError((_) => <MaintenanceTicket>[]),
      ]);
      _appointments = results[0] as List<Appointment>;
      _tickets = results[1] as List<MaintenanceTicket>;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch assigned appointments for a technician (FR9)
  Future<void> fetchMyAppointments(String userIdOrTechId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // 1. Fetch technician profiles to resolve candidate IDs (userId vs technicianProfile.id)
      if (_technicians.isEmpty) {
        try {
          _technicians = await _apiService.fetchTechnicians();
        } catch (_) {}
      }

      final candidateIds = <String>{};
      if (userIdOrTechId.isNotEmpty) {
        candidateIds.add(userIdOrTechId);
      }

      for (final t in _technicians) {
        if (t.id == userIdOrTechId || t.userId == userIdOrTechId ||
            (userEmail.isNotEmpty && t.email?.toLowerCase() == userEmail.toLowerCase())) {
          candidateIds.add(t.id);
          candidateIds.add(t.userId);
        }
      }

      // 2. Query technician appointments API for candidate IDs
      List<Appointment> results = [];
      for (final id in candidateIds) {
        if (id.isEmpty) continue;
        try {
          final list = await _apiService.fetchMyAppointments(id);
          results.addAll(list);
        } catch (_) {}
      }

      // 3. Fallback: If specific endpoint returned empty or unfiltered, load all appointments and filter locally
      if (results.isEmpty) {
        final all = await _apiService.fetchAppointments();
        results = all.where((a) => candidateIds.contains(a.technicianId)).toList();
      }

      // Strictly filter by candidate IDs & deduplicate by appointment ID
      final seen = <String>{};
      _appointments = results.where((a) {
        final matches = candidateIds.isEmpty || candidateIds.contains(a.technicianId);
        return matches && seen.add(a.id);
      }).toList();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch quotations list (FR10)
  Future<void> loadQuotations() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _quotations = await _apiService.fetchQuotations();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ---------------------------------------------------------------------------
  // MUTATION ACTIONS
  // ---------------------------------------------------------------------------

  /// Approve a quotation (FR10)
  Future<bool> approveQuotation(String quotationId) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final approved = await _apiService.approveQuotation(quotationId);
      
      // Update in local state list
      final index = _quotations.indexWhere((q) => q.id == quotationId);
      if (index != -1) {
        _quotations[index] = approved;
      } else {
        await loadQuotations();
      }

      _successMessage =
          'Quotation approved successfully! Booking confirmation emails dispatched to Tenant & Technician.';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Create a new quotation (FR10)
  Future<bool> createQuotation(Map<String, dynamic> data) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final created = await _apiService.createQuotation(data);
      _quotations.insert(0, created);
      _successMessage = 'Quotation submitted successfully for approval.';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Create a new maintenance appointment (Property Manager)
  Future<bool> createAppointment(Map<String, dynamic> data) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final created = await _apiService.createAppointment(data);
      _appointments.add(created);
      _successMessage = 'Appointment created successfully.';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Update appointment schedule details (Property Manager)
  Future<bool> updateAppointmentSchedule(String id, Map<String, dynamic> data) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final updated = await _apiService.updateAppointmentSchedule(id, data);
      if (updated != null) {
        final index = _appointments.indexWhere((a) => a.id == id);
        if (index != -1) {
          _appointments[index] = updated;
        } else {
          await loadAppointments();
        }
      }
      _successMessage = 'Appointment rescheduled successfully.';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Update appointment status
  Future<bool> updateAppointmentStatus(String appointmentId, String newStatus) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final index = _appointments.indexWhere((a) => a.id == appointmentId);
      final currentApt = index != -1 ? _appointments[index] : null;

      final updated = await _apiService.updateAppointmentStatus(
        appointmentId,
        newStatus,
        appointment: currentApt,
      );

      if (updated != null) {
        if (index != -1) {
          _appointments[index] = updated;
        }
      } else if (currentApt != null && index != -1) {
        _appointments[index] = currentApt.copyWith(status: newStatus);
      }
      _successMessage = 'Appointment status updated to "$newStatus".';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Update technician profile (Property Manager or Technician edit)
  Future<bool> updateTechnicianProfile(String id, Map<String, dynamic> data) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final updated = await _apiService.updateTechnicianProfile(id, data);
      final index = _technicians.indexWhere((t) => t.id == id);
      if (index != -1) {
        _technicians[index] = updated;
      } else {
        await loadTechnicians();
      }

      _successMessage = 'Technician profile updated successfully.';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Create technician profile (Property Manager)
  Future<bool> createTechnicianProfile(Map<String, dynamic> data) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final created = await _apiService.createTechnicianProfile(data);
      _technicians.add(created);
      _successMessage = 'Technician profile created successfully.';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Delete / Deactivate technician profile (Property Manager)
  Future<bool> deleteTechnicianProfile(String id) async {
    _isLoading = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final ok = await _apiService.deleteTechnicianProfile(id);
      if (ok) {
        _technicians.removeWhere((t) => t.id == id);
      }
      _successMessage = 'Technician profile deactivated successfully.';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
