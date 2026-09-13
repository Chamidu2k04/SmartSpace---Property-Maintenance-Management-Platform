
enum TicketStatus {
  submitted,
  analyzing,
  pendingApproval,
  scheduled,
  completed;

  static TicketStatus fromString(String? value) {
    if (value == null) return TicketStatus.submitted;
    switch (value.trim().toLowerCase()) {
      case 'analyzing':
        return TicketStatus.analyzing;
      case 'pendingapproval':
      case 'pending_approval':
      case 'pending approval':
        return TicketStatus.pendingApproval;
      case 'scheduled':
        return TicketStatus.scheduled;
      case 'completed':
      case 'resolved':
      case 'closed':
        return TicketStatus.completed;
      case 'submitted':
      default:
        return TicketStatus.submitted;
    }
  }

  static TicketStatus fromInt(int? value) {
    switch (value) {
      case 1:
        return TicketStatus.analyzing;
      case 2:
        return TicketStatus.pendingApproval;
      case 3:
        return TicketStatus.scheduled;
      case 4:
        return TicketStatus.completed;
      case 0:
      default:
        return TicketStatus.submitted;
    }
  }

  String get displayName {
    switch (this) {
      case TicketStatus.submitted:
        return 'Submitted';
      case TicketStatus.analyzing:
        return 'Analyzing';
      case TicketStatus.pendingApproval:
        return 'Pending Approval';
      case TicketStatus.scheduled:
        return 'Scheduled';
      case TicketStatus.completed:
        return 'Completed';
    }
  }

  String toApiString() {
    switch (this) {
      case TicketStatus.submitted:
        return 'Submitted';
      case TicketStatus.analyzing:
        return 'Analyzing';
      case TicketStatus.pendingApproval:
        return 'PendingApproval';
      case TicketStatus.scheduled:
        return 'Scheduled';
      case TicketStatus.completed:
        return 'Completed';
    }
  }
}

enum TicketUrgency {
  low,
  medium,
  high,
  emergency;

  static TicketUrgency fromString(String? value) {
    if (value == null) return TicketUrgency.medium;
    switch (value.trim().toLowerCase()) {
      case 'low':
        return TicketUrgency.low;
      case 'high':
        return TicketUrgency.high;
      case 'emergency':
      case 'critical':
        return TicketUrgency.emergency;
      case 'medium':
      default:
        return TicketUrgency.medium;
    }
  }

  static TicketUrgency fromInt(int? value) {
    switch (value) {
      case 0:
        return TicketUrgency.low;
      case 2:
        return TicketUrgency.high;
      case 3:
        return TicketUrgency.emergency;
      case 1:
      default:
        return TicketUrgency.medium;
    }
  }

  String get displayName {
    switch (this) {
      case TicketUrgency.low:
        return 'Low';
      case TicketUrgency.medium:
        return 'Medium';
      case TicketUrgency.high:
        return 'High';
      case TicketUrgency.emergency:
        return 'Emergency';
    }
  }

  int toApiInt() {
    switch (this) {
      case TicketUrgency.low:
        return 0;
      case TicketUrgency.medium:
        return 1;
      case TicketUrgency.high:
        return 2;
      case TicketUrgency.emergency:
        return 3;
    }
  }
}

class AgentExecutionLog {
  final String agentRole;
  final String actionTaken;
  final String workflowState;
  final DateTime createdAt;

  AgentExecutionLog({
    required this.agentRole,
    required this.actionTaken,
    required this.workflowState,
    required this.createdAt,
  });

  /// Converts UTC createdAt timestamp to Sri Lanka Time (IST = UTC+5:30).
  DateTime get createdAtIst {
    final utc = createdAt.isUtc ? createdAt : createdAt.toUtc();
    return utc.add(const Duration(hours: 5, minutes: 30));
  }

  factory AgentExecutionLog.fromJson(Map<String, dynamic> json) {
    DateTime parsedDate = DateTime.now().toUtc();
    if (json['createdAt'] != null) {
      final parsed = DateTime.tryParse(json['createdAt'].toString());
      if (parsed != null) {
        parsedDate = parsed.isUtc ? parsed : parsed.toUtc();
      }
    }

    return AgentExecutionLog(
      agentRole: json['agentRole']?.toString() ?? 'System Agent',
      actionTaken: json['actionTaken']?.toString() ?? '',
      workflowState: json['workflowState']?.toString() ?? '{}',
      createdAt: parsedDate,
    );
  }
}

class Ticket {
  final String id;
  final String tenantId;
  final String tenantName;
  final String unitId;
  final String unitNumber;
  final String description;
  final TicketUrgency urgencyLevel;
  final TicketStatus status;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final List<String> imageUrls;
  final String? thumbnailUrl;
  final List<AgentExecutionLog> agentExecutionLogs;

  Ticket({
    required this.id,
    required this.tenantId,
    required this.tenantName,
    required this.unitId,
    required this.unitNumber,
    required this.description,
    required this.urgencyLevel,
    required this.status,
    required this.createdAt,
    this.updatedAt,
    required this.imageUrls,
    this.thumbnailUrl,
    required this.agentExecutionLogs,
  });

  /// Converts UTC createdAt timestamp to Sri Lanka Time (IST = UTC+5:30).
  DateTime get createdAtIst {
    final utc = createdAt.isUtc ? createdAt : createdAt.toUtc();
    return utc.add(const Duration(hours: 5, minutes: 30));
  }

  /// Converts UTC updatedAt timestamp to Sri Lanka Time (IST = UTC+5:30).
  DateTime? get updatedAtIst {
    if (updatedAt == null) return null;
    final utc = updatedAt!.isUtc ? updatedAt! : updatedAt!.toUtc();
    return utc.add(const Duration(hours: 5, minutes: 30));
  }

  factory Ticket.fromJson(Map<String, dynamic> json) {
    // Handle urgency parsing (numeric vs string)
    TicketUrgency urgency;
    if (json['urgencyLevel'] is int) {
      urgency = TicketUrgency.fromInt(json['urgencyLevel'] as int);
    } else {
      urgency = TicketUrgency.fromString(json['urgencyLevel']?.toString());
    }

    // Handle status parsing (numeric vs string)
    TicketStatus statusVal;
    if (json['status'] is int) {
      statusVal = TicketStatus.fromInt(json['status'] as int);
    } else {
      statusVal = TicketStatus.fromString(json['status']?.toString());
    }

    // Parse image URLs list
    List<String> images = [];
    if (json['imageUrls'] is List) {
      images = (json['imageUrls'] as List)
          .map((e) => e.toString())
          .where((url) => url.isNotEmpty)
          .toList();
    } else if (json['thumbnailUrl'] != null && json['thumbnailUrl'].toString().isNotEmpty) {
      images.add(json['thumbnailUrl'].toString());
    }

    // Parse execution logs
    List<AgentExecutionLog> logs = [];
    if (json['agentExecutionLogs'] is List) {
      logs = (json['agentExecutionLogs'] as List)
          .map((e) => AgentExecutionLog.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    }

    DateTime parsedCreatedAt = DateTime.now().toUtc();
    if (json['createdAt'] != null) {
      final parsed = DateTime.tryParse(json['createdAt'].toString());
      if (parsed != null) {
        parsedCreatedAt = parsed.isUtc ? parsed : parsed.toUtc();
      }
    }

    DateTime? parsedUpdatedAt;
    if (json['updatedAt'] != null) {
      final parsed = DateTime.tryParse(json['updatedAt'].toString());
      if (parsed != null) {
        parsedUpdatedAt = parsed.isUtc ? parsed : parsed.toUtc();
      }
    }

    return Ticket(
      id: json['id']?.toString() ?? '',
      tenantId: json['tenantId']?.toString() ?? '',
      tenantName: json['tenantName']?.toString() ?? '',
      unitId: json['unitId']?.toString() ?? '',
      unitNumber: json['unitNumber']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      urgencyLevel: urgency,
      status: statusVal,
      createdAt: parsedCreatedAt,
      updatedAt: parsedUpdatedAt,
      imageUrls: images,
      thumbnailUrl: json['thumbnailUrl']?.toString(),
      agentExecutionLogs: logs,
    );
  }
}
