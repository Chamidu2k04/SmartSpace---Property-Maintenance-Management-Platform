import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/ticket_model.dart';
import 'status_badge.dart';
import 'urgency_badge.dart';

class TicketCard extends StatelessWidget {
  final Ticket ticket;
  final VoidCallback onTap;

  const TicketCard({
    super.key,
    required this.ticket,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final formattedDate = DateFormat('MMM d, yyyy · h:mm a').format(ticket.createdAtIst);
    final shortId = '#T-${ticket.id.substring(0, 8).toUpperCase()}';

    return Card(
      margin: const EdgeInsets.only(bottom: 14.0),
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.0),
        side: BorderSide(color: Colors.grey.shade200, width: 1.2),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16.0),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Bar: Ticket ID + Unit Number + Badges
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      shortId,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        color: Color(0xFF6B7280),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E3A8A).withAlpha(15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.door_front_door_outlined,
                          size: 14,
                          color: Color(0xFF1E3A8A),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          ticket.unitNumber.isNotEmpty ? 'Unit ${ticket.unitNumber}' : 'My Unit',
                          style: const TextStyle(
                            color: Color(0xFF1E3A8A),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  UrgencyBadge(urgency: ticket.urgencyLevel, compact: true),
                  const SizedBox(width: 6),
                  StatusBadge(status: ticket.status, compact: true),
                ],
              ),
              const SizedBox(height: 12),

              // Ticket Description Snippet
              Text(
                ticket.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 12),

              const Divider(height: 1, color: Color(0xFFF3F4F6)),
              const SizedBox(height: 10),

              // Bottom Info Bar: Created Date + Image Count + Arrow
              Row(
                children: [
                  Icon(Icons.access_time_rounded, size: 14, color: Colors.grey.shade500),
                  const SizedBox(width: 5),
                  Text(
                    formattedDate,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Spacer(),
                  if (ticket.imageUrls.isNotEmpty) ...[
                    Icon(Icons.photo_library_outlined, size: 14, color: Colors.grey.shade600),
                    const SizedBox(width: 4),
                    Text(
                      '${ticket.imageUrls.length}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Icon(
                    Icons.chevron_right_rounded,
                    size: 20,
                    color: Colors.grey.shade400,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
