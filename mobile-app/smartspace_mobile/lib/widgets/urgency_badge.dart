import 'package:flutter/material.dart';
import '../models/ticket_model.dart';

class UrgencyBadge extends StatelessWidget {
  final TicketUrgency urgency;
  final bool compact;

  const UrgencyBadge({
    super.key,
    required this.urgency,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    Color textColor;
    Color bgColor;
    IconData? iconData;

    switch (urgency) {
      case TicketUrgency.low:
        textColor = const Color(0xFF475569); // Slate 600
        bgColor = const Color(0xFFF1F5F9); // Slate 100
        iconData = Icons.arrow_downward_rounded;
        break;
      case TicketUrgency.medium:
        textColor = const Color(0xFFC2410C); // Orange 700
        bgColor = const Color(0xFFFFEDD5); // Orange 100
        iconData = Icons.remove_rounded;
        break;
      case TicketUrgency.high:
        textColor = const Color(0xFFB91C1C); // Red 700
        bgColor = const Color(0xFFFEE2E2); // Red 100
        iconData = Icons.priority_high_rounded;
        break;
      case TicketUrgency.emergency:
        textColor = const Color(0xFF991B1B); // Red 800
        bgColor = const Color(0xFFFECDD3); // Rose 200
        iconData = Icons.local_fire_department_rounded;
        break;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 7 : 9,
        vertical: compact ? 3 : 4,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: textColor.withAlpha(40), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ...[
            Icon(
              iconData,
              size: compact ? 11 : 13,
              color: textColor,
            ),
            const SizedBox(width: 3),
          ],
          Text(
            urgency.displayName,
            style: TextStyle(
              color: textColor,
              fontSize: compact ? 10 : 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
