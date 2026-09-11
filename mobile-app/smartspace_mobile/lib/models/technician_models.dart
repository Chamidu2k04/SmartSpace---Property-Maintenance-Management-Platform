/// Represents trade specialties available in the system.
class TradeSpecialty {
  static const String plumber = 'Plumber';
  static const String electrician = 'Electrician';
  static const String handyman = 'Handyman';

  static const List<String> values = [plumber, electrician, handyman];

  static String normalize(String? raw) {
    if (raw == null) return handyman;
    final lower = raw.trim().toLowerCase();
    if (lower == 'plumber') return plumber;
    if (lower == 'electrician') return electrician;
    return handyman;
  }
}

/// Represents lifecycle statuses for maintenance appointments.
class AppointmentStatus {
  static const String scheduled = 'Scheduled';
  static const String inProgress = 'InProgress';
  static const String completed = 'Completed';
  static const String cancelled = 'Cancelled';

  static const List<String> values = [scheduled, inProgress, completed, cancelled];

  static String normalize(String? raw) {
    if (raw == null) return scheduled;
    final lower = raw.trim().toLowerCase();
    if (lower == 'inprogress' || lower == 'in_progress' || lower == 'in progress') {
      return inProgress;
    }
    if (lower == 'completed') return completed;
    if (lower == 'cancelled' || lower == 'canceled') return cancelled;
    return scheduled;
  }
}

/// 1. TechnicianProfile Model (TechnicianProfiles table / DTO)
class TechnicianProfile {
  final String id;
  final String userId;
  final String? email;
  final String? fullName;
  final String tradeSpecialty;
  final double hourlyRate;

  TechnicianProfile({
    required this.id,
    required this.userId,
    this.email,
    this.fullName,
    required this.tradeSpecialty,
    required this.hourlyRate,
  });

  factory TechnicianProfile.fromJson(Map<String, dynamic> json) {
    return TechnicianProfile(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? json['id']?.toString() ?? '',
      email: json['email']?.toString(),
      fullName: json['fullName']?.toString() ?? json['name']?.toString(),
      tradeSpecialty: TradeSpecialty.normalize(json['tradeSpecialty']?.toString()),
      hourlyRate: _parseDouble(json['hourlyRate']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      if (email != null) 'email': email,
      if (fullName != null) 'fullName': fullName,
      'tradeSpecialty': tradeSpecialty,
      'hourlyRate': hourlyRate,
    };
  }

  TechnicianProfile copyWith({
    String? id,
    String? userId,
    String? email,
    String? fullName,
    String? tradeSpecialty,
    double? hourlyRate,
  }) {
    return TechnicianProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      tradeSpecialty: tradeSpecialty ?? this.tradeSpecialty,
      hourlyRate: hourlyRate ?? this.hourlyRate,
    );
  }

  static double _parseDouble(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    return double.tryParse(val.toString()) ?? 0.0;
  }
}

/// 2. Appointment Model (Appointments table / DTO)
class Appointment {
  final String id;
  final String ticketId;
  final String technicianId;
  final String scheduledDate; // Format: YYYY-MM-DD
  final String startTime; // Format: HH:mm:ss
  final String endTime; // Format: HH:mm:ss
  final String status; // Scheduled | InProgress | Completed | Cancelled
  final String propertyName;
  final String unitNumber;
  final int floor;

  Appointment({
    required this.id,
    required this.ticketId,
    required this.technicianId,
    required this.scheduledDate,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.propertyName = 'SmartSpace Property',
    this.unitNumber = 'N/A',
    this.floor = 1,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id']?.toString() ?? '',
      ticketId: json['ticketId']?.toString() ?? '',
      technicianId: json['technicianId']?.toString() ?? '',
      scheduledDate: json['scheduledDate']?.toString() ?? '',
      startTime: json['startTime']?.toString() ?? '',
      endTime: json['endTime']?.toString() ?? '',
      status: AppointmentStatus.normalize(json['status']?.toString()),
      propertyName: json['propertyName']?.toString() ?? json['PropertyName']?.toString() ?? 'SmartSpace Property',
      unitNumber: json['unitNumber']?.toString() ?? json['UnitNumber']?.toString() ?? 'N/A',
      floor: _parseInt(json['floor'] ?? json['Floor']),
    );
  }

  static int _parseInt(dynamic val) {
    if (val == null) return 1;
    if (val is num) return val.toInt();
    return int.tryParse(val.toString()) ?? 1;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ticketId': ticketId,
      'technicianId': technicianId,
      'scheduledDate': scheduledDate,
      'startTime': startTime,
      'endTime': endTime,
      'status': status,
      'propertyName': propertyName,
      'unitNumber': unitNumber,
      'floor': floor,
    };
  }

  Appointment copyWith({
    String? id,
    String? ticketId,
    String? technicianId,
    String? scheduledDate,
    String? startTime,
    String? endTime,
    String? status,
    String? propertyName,
    String? unitNumber,
    int? floor,
  }) {
    return Appointment(
      id: id ?? this.id,
      ticketId: ticketId ?? this.ticketId,
      technicianId: technicianId ?? this.technicianId,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      status: status ?? this.status,
      propertyName: propertyName ?? this.propertyName,
      unitNumber: unitNumber ?? this.unitNumber,
      floor: floor ?? this.floor,
    );
  }
}

/// 3. Quotation Model (Quotations table / DTO)
class Quotation {
  final String id;
  final String ticketId;
  final double laborCost;
  final double partsCost;
  final double totalCost;
  final bool isApproved;

  Quotation({
    required this.id,
    required this.ticketId,
    required this.laborCost,
    required this.partsCost,
    required this.totalCost,
    required this.isApproved,
  });

  factory Quotation.fromJson(Map<String, dynamic> json) {
    final labor = _parseDouble(json['laborCost']);
    final parts = _parseDouble(json['partsCost']);
    final total = _parseDouble(json['totalCost']);
    final calculatedTotal = total > 0 ? total : (labor + parts);

    return Quotation(
      id: json['id']?.toString() ?? '',
      ticketId: json['ticketId']?.toString() ?? '',
      laborCost: labor,
      partsCost: parts,
      totalCost: calculatedTotal,
      isApproved: json['isApproved'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ticketId': ticketId,
      'laborCost': laborCost,
      'partsCost': partsCost,
      'totalCost': totalCost,
      'isApproved': isApproved,
    };
  }

  Quotation copyWith({
    String? id,
    String? ticketId,
    double? laborCost,
    double? partsCost,
    double? totalCost,
    bool? isApproved,
  }) {
    return Quotation(
      id: id ?? this.id,
      ticketId: ticketId ?? this.ticketId,
      laborCost: laborCost ?? this.laborCost,
      partsCost: partsCost ?? this.partsCost,
      totalCost: totalCost ?? this.totalCost,
      isApproved: isApproved ?? this.isApproved,
    );
  }

  static double _parseDouble(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    return double.tryParse(val.toString()) ?? 0.0;
  }
}

/// 4. MaintenanceTicket Model for ticket dropdown selector
class MaintenanceTicket {
  final String id;
  final String unitNumber;
  final String description;
  final String urgencyLevel;
  final String status;

  MaintenanceTicket({
    required this.id,
    required this.unitNumber,
    required this.description,
    required this.urgencyLevel,
    required this.status,
  });

  factory MaintenanceTicket.fromJson(Map<String, dynamic> json) {
    return MaintenanceTicket(
      id: json['id']?.toString() ?? json['Id']?.toString() ?? '',
      unitNumber: json['unitNumber']?.toString() ?? json['UnitNumber']?.toString() ?? 'N/A',
      description: json['description']?.toString() ?? json['Description']?.toString() ?? '',
      urgencyLevel: json['urgencyLevel']?.toString() ?? json['UrgencyLevel']?.toString() ?? 'Normal',
      status: json['status']?.toString() ?? json['Status']?.toString() ?? 'Submitted',
    );
  }

  String get displayLabel {
    final desc = description.length > 28 ? '${description.substring(0, 28)}...' : (description.isEmpty ? 'No Description' : description);
    return 'Unit $unitNumber - $desc ($urgencyLevel)';
  }
}
