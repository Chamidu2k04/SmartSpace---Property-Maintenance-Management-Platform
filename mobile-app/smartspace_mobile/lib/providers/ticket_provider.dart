import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import '../models/ticket_model.dart';
import '../services/ticket_service.dart';

class TicketProvider with ChangeNotifier {
  final TicketService _ticketService;

  TicketProvider({TicketService? ticketService})
      : _ticketService = ticketService ?? TicketService();

  List<Ticket> _tickets = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  TicketStatus? _statusFilter;

  List<Ticket> get tickets => _tickets;

  List<Ticket> get filteredTickets {
    if (_statusFilter == null) return _tickets;
    return _tickets.where((t) => t.status == _statusFilter).toList();
  }

  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  TicketStatus? get statusFilter => _statusFilter;

  void setStatusFilter(TicketStatus? filter) {
    _statusFilter = filter;
    notifyListeners();
  }

  /// Load all maintenance requests submitted by the tenant.
  Future<void> loadMyTickets() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _tickets = await _ticketService.getMyTickets();
      // Sort most recent first
      _tickets.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Submit a new ticket. Returns the newly created ticket on success.
  Future<Ticket?> submitTicket({
    required String unitId,
    required String description,
    required TicketUrgency urgencyLevel,
    List<XFile>? imageFiles,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final newTicket = await _ticketService.createTicket(
        unitId: unitId,
        description: description,
        urgencyLevel: urgencyLevel,
        imageFiles: imageFiles,
      );
      _tickets.insert(0, newTicket);
      return newTicket;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      return null;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  /// Fetch full details for a single ticket.
  Future<Ticket?> getTicketById(String id) async {
    try {
      return await _ticketService.getTicketById(id);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      return null;
    }
  }

  /// Update an existing maintenance ticket's description and urgency.
  Future<bool> updateTicket({
    required String ticketId,
    required String description,
    required TicketUrgency urgencyLevel,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _ticketService.updateTicket(
        ticketId: ticketId,
        description: description,
        urgencyLevel: urgencyLevel,
      );

      // Reload list from backend to get updated data
      await loadMyTickets();

      _isSubmitting = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
