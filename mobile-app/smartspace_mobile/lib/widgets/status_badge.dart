import 'package:flutter/material.dart';
import '../models/ticket_model.dart';

class StatusBadge extends StatelessWidget {
  final TicketStatus status;
  final bool compact;

  const StatusBadge({
    super.key,
    required this.status,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    Color textColor;
    Color bgColor;

    switch (status) {
      case TicketStatus.submitted:
        textColor = const Color(0xFF1D4ED8); // Blue 700
        bgColor = const Color(0xFFEFF6FF); // Blue 50
        break;
      case TicketStatus.analyzing:
        textColor = const Color(0xFF7E22CE); // Purple 700
        bgColor = const Color(0xFFF3E8FF); // Purple 50
        break;
      case TicketStatus.pendingApproval:
        textColor = const Color(0xFFB45309); // Amber 700
        bgColor = const Color(0xFFFEF3C7); // Amber 100
        break;
      case TicketStatus.scheduled:
        textColor = const Color(0xFF0F766E); // Teal 700
        bgColor = const Color(0xFFCCFBF1); // Teal 100
        break;
      case TicketStatus.completed:
        textColor = const Color(0xFF047857); // Emerald 700
        bgColor = const Color(0xFFD1FAE5); // Emerald 100
        break;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withAlpha(50), width: 1),
      ),
      child: Text(
        status.displayName.toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontSize: compact ? 10 : 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}
