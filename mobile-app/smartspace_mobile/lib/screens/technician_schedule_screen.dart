import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/technician_models.dart';
import '../models/user_model.dart';
import '../providers/technician_provider.dart';
import '../providers/auth_provider.dart';

/// Screen displaying Appointments & Scheduling module (FR9)
class TechnicianScheduleScreen extends StatefulWidget {
  final String? technicianId;
  final bool isEmbedded;

  const TechnicianScheduleScreen({
    super.key,
    this.technicianId,
    this.isEmbedded = false,
  });

  @override
  State<TechnicianScheduleScreen> createState() => _TechnicianScheduleScreenState();
}

class _TechnicianScheduleScreenState extends State<TechnicianScheduleScreen> {
  // Theme Color Constants (Matching React Web Palette)
  static const Color _deepIndigo = Color(0xFF1E3A8A);
  static const Color _emeraldGreen = Color(0xFF10B981);
  static const Color _lightBg = Color(0xFFF3F4F6);

  String _selectedFilter = 'All';
  DateTime? _filterDate;
  String? _updatingAppointmentId;

  late TextEditingController _searchController;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final provider = Provider.of<TechnicianProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final isManager = authProvider.user != null
        ? authProvider.user!.role == UserRole.propertyManager
        : provider.isPropertyManager;

    if (isManager) {
      await Future.wait([
        provider.loadAppointments(),
        provider.loadTechnicians(),
        provider.loadTickets(),
      ]);
    } else {
      final techId = widget.technicianId ?? authProvider.user?.id ?? provider.userId;
      await provider.fetchMyAppointments(techId);
    }
  }

  TimeOfDay _parseTimeOfDay(String timeStr) {
    if (timeStr.isEmpty) return const TimeOfDay(hour: 9, minute: 0);
    final parts = timeStr.split(':');
    if (parts.length >= 2) {
      final h = int.tryParse(parts[0]) ?? 9;
      final m = int.tryParse(parts[1]) ?? 0;
      return TimeOfDay(hour: h, minute: m);
    }
    return const TimeOfDay(hour: 9, minute: 0);
  }

  String _formatTimeOfDay(TimeOfDay time) {
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m:00';
  }

  Widget _buildUserHeader() {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        final user = auth.user;
        final techProvider = Provider.of<TechnicianProvider>(context, listen: false);

        final String name = (user != null && user.fullName.isNotEmpty)
            ? user.fullName
            : (techProvider.isPropertyManager ? 'Property Manager' : 'Technician User');

        final String email = (user != null && user.email.isNotEmpty)
            ? user.email
            : (techProvider.userEmail.isNotEmpty
                ? techProvider.userEmail
                : (techProvider.isPropertyManager ? 'manager@smartspace.com' : 'technician@smartspace.com'));

        final String roleName = (user != null)
            ? (user.role == UserRole.propertyManager
                ? 'Property Manager'
                : (user.role == UserRole.technician
                    ? 'Technician'
                    : (user.role == UserRole.inventoryOfficer
                        ? 'Inventory Officer'
                        : 'Tenant')))
            : (techProvider.isPropertyManager ? 'Property Manager' : 'Technician');

        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: _deepIndigo.withValues(alpha: 0.1),
                child: const Icon(Icons.person, color: _deepIndigo, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Colors.black87,
                      ),
                    ),
                    Text(
                      email,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.indigo.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  roleName,
                  style: TextStyle(
                    color: Colors.indigo.shade700,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _openAppointmentModal({Appointment? appointment}) {
    final isRescheduling = appointment != null;
    final provider = Provider.of<TechnicianProvider>(context, listen: false);
    final technicians = provider.technicians;
    final tickets = provider.tickets;
    final existingAppointments = provider.appointments;

    // Filter unscheduled tickets
    final scheduledTicketIds = existingAppointments.map((a) => a.ticketId.toLowerCase()).toSet();
    final unscheduledTickets = tickets.where((t) => !scheduledTicketIds.contains(t.id.toLowerCase())).toList();
    final availableTickets = unscheduledTickets.isNotEmpty ? unscheduledTickets : tickets;

    String selectedTicketId = appointment?.ticketId ??
        (availableTickets.isNotEmpty ? availableTickets.first.id : '');

    final ticketIdController =
        TextEditingController(text: selectedTicketId);

    String selectedTechId = appointment?.technicianId ??
        (technicians.isNotEmpty ? technicians.first.id : '');

    if (technicians.isNotEmpty &&
        !technicians.any((t) => t.id == selectedTechId || t.userId == selectedTechId)) {
      selectedTechId = technicians.first.id;
    }

    DateTime selectedDate = isRescheduling
        ? (DateTime.tryParse(appointment.scheduledDate) ?? DateTime.now())
        : DateTime.now();

    TimeOfDay startTime = isRescheduling
        ? _parseTimeOfDay(appointment.startTime)
        : const TimeOfDay(hour: 9, minute: 0);

    TimeOfDay endTime = isRescheduling
        ? _parseTimeOfDay(appointment.endTime)
        : const TimeOfDay(hour: 11, minute: 0);

    String selectedStatus = appointment?.status ?? AppointmentStatus.scheduled;
    String? modalError;
    bool isSaving = false;

    showDialog(
      context: context,
      barrierDismissible: !isSaving,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: [
                  Icon(
                    isRescheduling ? Icons.edit_calendar : Icons.calendar_month,
                    color: _deepIndigo,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      isRescheduling ? 'Reschedule Appointment' : 'Schedule New Appointment',
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (modalError != null)
                      Container(
                        padding: const EdgeInsets.all(10),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, size: 18, color: Colors.red),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                modalError!,
                                style: const TextStyle(fontSize: 12, color: Colors.red),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Maintenance Ticket Dropdown / Input
                    const Text(
                      'Select Maintenance Ticket *',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 4),
                    if (isRescheduling)
                      TextField(
                        controller: ticketIdController,
                        enabled: false,
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.confirmation_number, size: 18, color: _deepIndigo),
                          filled: true,
                          fillColor: Colors.grey.shade100,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                        ),
                      )
                    else if (tickets.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: availableTickets.any((t) => t.id == selectedTicketId)
                                ? selectedTicketId
                                : (availableTickets.isNotEmpty ? availableTickets.first.id : null),
                            isExpanded: true,
                            hint: const Text('Select a ticket...'),
                            items: availableTickets.map((ticket) {
                              return DropdownMenuItem<String>(
                                value: ticket.id,
                                child: Text(
                                  ticket.displayLabel,
                                  style: const TextStyle(fontSize: 13),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setDialogState(() {
                                  selectedTicketId = val;
                                  ticketIdController.text = val;
                                });
                              }
                            },
                          ),
                        ),
                      )
                    else
                      TextField(
                        controller: ticketIdController,
                        decoration: InputDecoration(
                          hintText: 'Enter Ticket GUID...',
                          hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                          prefixIcon: const Icon(Icons.confirmation_number, size: 18, color: _deepIndigo),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                        ),
                      ),
                    const SizedBox(height: 14),

                    // Assigned Technician Dropdown
                    const Text(
                      'Assigned Technician *',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: technicians.any((t) => t.id == selectedTechId)
                              ? selectedTechId
                              : (technicians.isNotEmpty ? technicians.first.id : null),
                          isExpanded: true,
                          hint: const Text('Select a technician'),
                          items: technicians.map((tech) {
                            return DropdownMenuItem<String>(
                              value: tech.id,
                              child: Text(
                                '${tech.fullName ?? "Technician"} (${tech.tradeSpecialty})',
                                style: const TextStyle(fontSize: 13),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setDialogState(() => selectedTechId = val);
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Scheduled Date Picker
                    const Text(
                      'Scheduled Date *',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 4),
                    InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: selectedDate,
                          firstDate: DateTime(2020),
                          lastDate: DateTime(2030),
                        );
                        if (picked != null) {
                          setDialogState(() => selectedDate = picked);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_today, size: 18, color: _deepIndigo),
                            const SizedBox(width: 10),
                            Text(
                              "${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}",
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Start Time & End Time Picker Row
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Start Time *',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                              ),
                              const SizedBox(height: 4),
                              InkWell(
                                onTap: () async {
                                  final picked = await showTimePicker(
                                    context: context,
                                    initialTime: startTime,
                                  );
                                  if (picked != null) {
                                    setDialogState(() => startTime = picked);
                                  }
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.grey.shade300),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.access_time, size: 16, color: _deepIndigo),
                                      const SizedBox(width: 6),
                                      Text(
                                        "${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')}",
                                        style: const TextStyle(fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'End Time *',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                              ),
                              const SizedBox(height: 4),
                              InkWell(
                                onTap: () async {
                                  final picked = await showTimePicker(
                                    context: context,
                                    initialTime: endTime,
                                  );
                                  if (picked != null) {
                                    setDialogState(() => endTime = picked);
                                  }
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.grey.shade300),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.access_time, size: 16, color: _deepIndigo),
                                      const SizedBox(width: 6),
                                      Text(
                                        "${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}",
                                        style: const TextStyle(fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Status selection (if rescheduling)
                    if (isRescheduling) ...[
                      const Text(
                        'Lifecycle Status',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: selectedStatus,
                            isExpanded: true,
                            items: const [
                              DropdownMenuItem(value: AppointmentStatus.scheduled, child: Text('Scheduled')),
                              DropdownMenuItem(value: AppointmentStatus.inProgress, child: Text('In Progress')),
                              DropdownMenuItem(value: AppointmentStatus.completed, child: Text('Completed')),
                              DropdownMenuItem(value: AppointmentStatus.cancelled, child: Text('Cancelled')),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                setDialogState(() => selectedStatus = val);
                              }
                            },
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSaving ? null : () => Navigator.of(dialogContext).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _deepIndigo,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: isSaving
                      ? null
                      : () async {
                          final ticketId = isRescheduling
                              ? ticketIdController.text.trim()
                              : (selectedTicketId.isNotEmpty ? selectedTicketId : ticketIdController.text.trim());

                          if (ticketId.isEmpty) {
                            setDialogState(() => modalError = 'Maintenance Ticket is required.');
                            return;
                          }
                          if (selectedTechId.isEmpty) {
                            setDialogState(() => modalError = 'Please select an assigned technician.');
                            return;
                          }
                          final startMinutes = startTime.hour * 60 + startTime.minute;
                          final endMinutes = endTime.hour * 60 + endTime.minute;
                          if (endMinutes <= startMinutes) {
                            setDialogState(() => modalError = 'End time must be after start time.');
                            return;
                          }

                          setDialogState(() {
                            isSaving = true;
                            modalError = null;
                          });

                          final dateStr =
                              "${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}";
                          final startStr = _formatTimeOfDay(startTime);
                          final endStr = _formatTimeOfDay(endTime);

                          bool success = false;
                          if (isRescheduling) {
                            final payload = {
                              'scheduledDate': dateStr,
                              'startTime': startStr,
                              'endTime': endStr,
                              'status': selectedStatus,
                              'technicianId': selectedTechId,
                            };
                            success = await provider.updateAppointmentSchedule(appointment.id, payload);
                          } else {
                            final payload = {
                              'ticketId': ticketId,
                              'technicianId': selectedTechId,
                              'scheduledDate': dateStr,
                              'startTime': startStr,
                              'endTime': endStr,
                              'status': selectedStatus,
                            };
                            success = await provider.createAppointment(payload);
                          }

                          if (dialogContext.mounted) {
                            if (success) {
                              Navigator.of(dialogContext).pop();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    isRescheduling
                                        ? 'Appointment rescheduled successfully!'
                                        : 'New appointment created successfully!',
                                  ),
                                  backgroundColor: _emeraldGreen,
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            } else {
                              setDialogState(() {
                                isSaving = false;
                                modalError = provider.errorMessage ?? 'Operation failed. Check details.';
                              });
                            }
                          }
                        },
                  child: isSaving
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(isRescheduling ? 'Save Changes' : 'Create Appointment'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _changeAppointmentStatus(
      Appointment appointment, String newStatus) async {
    if (appointment.status == newStatus) return;

    setState(() => _updatingAppointmentId = appointment.id);
    final provider = Provider.of<TechnicianProvider>(context, listen: false);

    final success =
        await provider.updateAppointmentStatus(appointment.id, newStatus);

    if (!mounted) return;
    setState(() => _updatingAppointmentId = null);

    final displayLabel =
        newStatus == AppointmentStatus.inProgress ? 'In Progress' : newStatus;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Text('Status updated to "$displayLabel"'),
            ],
          ),
          backgroundColor: _emeraldGreen,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 3),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } else if (provider.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage!),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<TechnicianProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);

    final isManager = authProvider.user != null
        ? authProvider.user!.role == UserRole.propertyManager
        : provider.isPropertyManager;

    // Technician Candidate IDs for strict filtering
    final currentUserId = authProvider.user?.id ?? provider.userId;
    final currentUserEmail = authProvider.user?.email ?? provider.userEmail;

    final candidateIds = <String>{};
    if (currentUserId.isNotEmpty) candidateIds.add(currentUserId);

    for (final t in provider.technicians) {
      if ((currentUserId.isNotEmpty && (t.id == currentUserId || t.userId == currentUserId)) ||
          (currentUserEmail.isNotEmpty && t.email?.toLowerCase() == currentUserEmail.toLowerCase())) {
        candidateIds.add(t.id);
        candidateIds.add(t.userId);
      }
    }

    // Filter list by role (Strictly assigned jobs if Technician) & UI filters
    final rawList = provider.appointments;
    final filtered = rawList.where((apt) {
      // 1. Role Scoping: Technicians ONLY see jobs assigned to them
      if (!isManager) {
        if (candidateIds.isNotEmpty && !candidateIds.contains(apt.technicianId)) {
          return false;
        }
      }

      // 2. Status Chip Filter
      final matchesStatus = _selectedFilter == 'All' ||
          apt.status.toLowerCase() == _selectedFilter.toLowerCase();

      // 3. Date Picker Filter
      bool matchesDate = true;
      if (_filterDate != null) {
        final dateStr =
            "${_filterDate!.year}-${_filterDate!.month.toString().padLeft(2, '0')}-${_filterDate!.day.toString().padLeft(2, '0')}";
        matchesDate = apt.scheduledDate.contains(dateStr);
      }

      // 4. Text Search Filter (Property Name, Unit Number & Date)
      bool matchesSearch = true;
      if (_searchQuery.trim().isNotEmpty) {
        final query = _searchQuery.trim().toLowerCase();
        final matchesTicketId = apt.ticketId.toLowerCase().contains(query);
        final matchesProperty = apt.propertyName.toLowerCase().contains(query);
        final matchesUnit = apt.unitNumber.toLowerCase().contains(query);
        final matchesScheduledDate = apt.scheduledDate.toLowerCase().contains(query);
        matchesSearch = matchesTicketId || matchesProperty || matchesUnit || matchesScheduledDate;
      }

      return matchesStatus && matchesDate && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: _lightBg,
      appBar: widget.isEmbedded
          ? null
          : AppBar(
              backgroundColor: _deepIndigo,
              foregroundColor: Colors.white,
              elevation: 0,
              title: const Row(
                children: [
                  Icon(Icons.calendar_month, size: 22),
                  SizedBox(width: 10),
                  Text(
                    'Appointments & Scheduling',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  icon: Icon(
                    _filterDate != null ? Icons.filter_alt : Icons.filter_alt_outlined,
                    color: Colors.white,
                  ),
                  tooltip: 'Filter by Date',
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _filterDate ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2030),
                    );
                    if (picked != null) {
                      setState(() => _filterDate = picked);
                    }
                  },
                ),
                if (_filterDate != null)
                  IconButton(
                    icon: const Icon(Icons.clear, color: Colors.white70),
                    tooltip: 'Clear Date Filter',
                    onPressed: () => setState(() => _filterDate = null),
                  ),
              ],
            ),
      floatingActionButton: isManager
          ? FloatingActionButton.extended(
              backgroundColor: _deepIndigo,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add, size: 20),
              label: const Text(
                'Schedule Appointment',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              onPressed: () => _openAppointmentModal(),
            )
          : null,
      body: RefreshIndicator(
        color: _deepIndigo,
        onRefresh: _loadData,
        child: Column(
          children: [
            // Top White Header Container: User Profile Card & Search Bar
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Column(
                children: [
                  _buildUserHeader(),
                  TextField(
                    controller: _searchController,
                    onChanged: (val) {
                      setState(() => _searchQuery = val);
                    },
                    decoration: InputDecoration(
                      hintText: 'Search by Property, Unit, Date...',
                      hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                      prefixIcon: const Icon(Icons.search, size: 20, color: _deepIndigo),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18, color: Colors.grey),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: const Color(0xFFF3F4F6),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Status Filter Chips Toolbar
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip('All', _selectedFilter == 'All'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Scheduled', _selectedFilter == 'Scheduled'),
                    const SizedBox(width: 8),
                    _buildFilterChip('InProgress', _selectedFilter == 'InProgress'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Completed', _selectedFilter == 'Completed'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Cancelled', _selectedFilter == 'Cancelled'),
                  ],
                ),
              ),
            ),

            // Active Date Filter Banner
            if (_filterDate != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                color: _deepIndigo.withValues(alpha: 0.08),
                child: Row(
                  children: [
                    const Icon(Icons.event, size: 16, color: _deepIndigo),
                    const SizedBox(width: 8),
                    Text(
                      'Filtered Date: ${_filterDate!.year}-${_filterDate!.month.toString().padLeft(2, '0')}-${_filterDate!.day.toString().padLeft(2, '0')}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: _deepIndigo,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => setState(() => _filterDate = null),
                      child: const Icon(Icons.close, size: 16, color: _deepIndigo),
                    ),
                  ],
                ),
              ),

            // Main Content Area
            Expanded(
              child: provider.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: _deepIndigo),
                    )
                  : provider.errorMessage != null && provider.errorMessage!.isNotEmpty
                      ? _buildErrorState(provider.errorMessage!)
                      : filtered.isEmpty
                          ? _buildEmptyState(isManager)
                          : ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                return _buildJobCard(
                                  filtered[index],
                                  provider.technicians,
                                  authProvider.user?.fullName,
                                  isManager,
                                );
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected) {
    return ChoiceChip(
      label: Text(
        label == 'InProgress' ? 'In Progress' : label,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.grey.shade800,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 13,
        ),
      ),
      selected: isSelected,
      selectedColor: _deepIndigo,
      checkmarkColor: Colors.white,
      backgroundColor: Colors.grey.shade100,
      side: BorderSide(
        color: isSelected ? _deepIndigo : Colors.grey.shade300,
      ),
      onSelected: (bool selected) {
        if (selected) {
          setState(() => _selectedFilter = label);
        }
      },
    );
  }

  /// Job Card matching the Web Table layout
  Widget _buildJobCard(
    Appointment appointment,
    List<TechnicianProfile> technicians,
    String? currentUserName,
    bool isManager,
  ) {
    // Resolve technician profile info
    TechnicianProfile? techProfile;
    try {
      techProfile = technicians.firstWhere(
        (t) => t.id == appointment.technicianId || t.userId == appointment.technicianId,
      );
    } catch (_) {}

    final techName = techProfile?.fullName ?? currentUserName ?? 'Assigned Technician';
    final isUpdating = _updatingAppointmentId == appointment.id;

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: Property Name & Unit / Floor Details
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.business, size: 20, color: _deepIndigo),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appointment.propertyName,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: _deepIndigo,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.home_outlined, size: 14, color: Colors.grey.shade600),
                          const SizedBox(width: 4),
                          Text(
                            'Unit ${appointment.unitNumber}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade800,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Icon(Icons.layers_outlined, size: 14, color: Colors.grey.shade600),
                          const SizedBox(width: 4),
                          Text(
                            'Floor ${appointment.floor}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey.shade700,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 10),
              child: Divider(height: 1),
            ),

            // Row 2: Assigned Technician
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ASSIGNED TECHNICIAN',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.person_outline, size: 16, color: Colors.grey.shade700),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              techName,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Row 3: Scheduled Window & Status Badge
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'SCHEDULED WINDOW',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        appointment.scheduledDate,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.access_time, size: 13, color: Colors.grey.shade600),
                          const SizedBox(width: 4),
                          Text(
                            '${_formatTime(appointment.startTime)} - ${_formatTime(appointment.endTime)}',
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Status Badge
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'STATUS',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 4),
                    _buildStatusBadge(appointment.status),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Row 4: Actions Bar (Reschedule & Dropdown Status Selector)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFAFAFA),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  const Text(
                    'ACTIONS:',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const Spacer(),
                  if (isManager) ...[
                    TextButton.icon(
                      style: TextButton.styleFrom(
                        foregroundColor: _deepIndigo,
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: () => _openAppointmentModal(appointment: appointment),
                      icon: const Icon(Icons.edit_calendar, size: 15),
                      label: const Text(
                        'Reschedule',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  if (isUpdating)
                    const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: _deepIndigo),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: _deepIndigo.withValues(alpha: 0.3)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: AppointmentStatus.values.contains(appointment.status)
                              ? appointment.status
                              : AppointmentStatus.scheduled,
                          isDense: true,
                          icon: const Icon(Icons.keyboard_arrow_down,
                              color: _deepIndigo, size: 18),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: _deepIndigo,
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: AppointmentStatus.scheduled,
                              child: Text('Scheduled'),
                            ),
                            DropdownMenuItem(
                              value: AppointmentStatus.inProgress,
                              child: Text('In Progress'),
                            ),
                            DropdownMenuItem(
                              value: AppointmentStatus.completed,
                              child: Text('Completed'),
                            ),
                            DropdownMenuItem(
                              value: AppointmentStatus.cancelled,
                              child: Text('Cancelled'),
                            ),
                          ],
                          onChanged: (newStatus) {
                            if (newStatus != null) {
                              _changeAppointmentStatus(appointment, newStatus);
                            }
                          },
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(String raw) {
    if (raw.isEmpty) return '';
    final parts = raw.split(':');
    if (parts.length >= 2) {
      return '${parts[0].padLeft(2, '0')}:${parts[1].padLeft(2, '0')}';
    }
    return raw;
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    IconData icon;

    switch (status) {
      case AppointmentStatus.completed:
        bg = _emeraldGreen.withValues(alpha: 0.12);
        fg = _emeraldGreen;
        icon = Icons.check_circle_outline;
        break;
      case AppointmentStatus.inProgress:
        bg = Colors.amber.shade100;
        fg = Colors.amber.shade900;
        icon = Icons.build_outlined;
        break;
      case AppointmentStatus.cancelled:
        bg = Colors.red.shade50;
        fg = Colors.red.shade700;
        icon = Icons.cancel_outlined;
        break;
      case AppointmentStatus.scheduled:
      default:
        bg = _deepIndigo.withValues(alpha: 0.1);
        fg = _deepIndigo;
        icon = Icons.schedule;
        break;
    }

    final displayLabel =
        status == AppointmentStatus.inProgress ? 'In Progress' : status;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: fg.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: fg),
          const SizedBox(width: 4),
          Text(
            displayLabel,
            style: TextStyle(
              color: fg,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isManager) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.event_busy, size: 48, color: Colors.grey.shade400),
            ),
            const SizedBox(height: 16),
            Text(
              isManager ? 'No Scheduled Appointments' : 'No Assigned Jobs Found',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _selectedFilter != 'All' || _filterDate != null || _searchQuery.isNotEmpty
                  ? 'No jobs match your current search & filter settings.'
                  : (isManager
                      ? 'No maintenance appointments are currently recorded.'
                      : 'You currently have no maintenance jobs assigned to your profile.'),
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _loadData,
              style: ElevatedButton.styleFrom(
                backgroundColor: _deepIndigo,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Refresh Schedule'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
            const SizedBox(height: 12),
            const Text(
              'Failed to Load Schedule',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              style: ElevatedButton.styleFrom(backgroundColor: _deepIndigo),
              child: const Text('Try Again', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
