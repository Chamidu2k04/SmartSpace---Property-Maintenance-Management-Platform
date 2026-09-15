import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/ticket_model.dart';
import '../models/user_model.dart';
import '../providers/auth_provider.dart';
import '../providers/ticket_provider.dart';
import '../services/ticket_service.dart';
import '../widgets/status_badge.dart';
import '../widgets/urgency_badge.dart';
import 'edit_ticket_screen.dart';
import 'photo_viewer_screen.dart';

class TicketDetailScreen extends StatefulWidget {
  final String ticketId;
  final Ticket? initialTicket;

  const TicketDetailScreen({
    super.key,
    required this.ticketId,
    this.initialTicket,
  });

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  Ticket? _ticket;
  bool _isLoading = true;
  String? _error;

  static const Color _indigo = Color(0xFF1E3A8A);
  static const Color _offWhite = Color(0xFFFAFAFA);

  @override
  void initState() {
    super.initState();
    _ticket = widget.initialTicket;
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    final provider = context.read<TicketProvider>();
    final fetched = await provider.getTicketById(widget.ticketId);

    if (mounted) {
      setState(() {
        if (fetched != null) {
          _ticket = fetched;
        } else if (_ticket == null) {
          _error = provider.errorMessage ?? 'Unable to load ticket details.';
        }
        _isLoading = false;
      });
    }
  }

  Future<void> _navigateToEdit() async {
    if (_ticket == null) return;
    final updated = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => EditTicketScreen(ticket: _ticket!),
      ),
    );

    if (updated == true && mounted) {
      _fetchDetails();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final userRole = authProvider.user?.role;

    final ticket = _ticket;

    final canEdit = userRole == UserRole.tenant && 
                    ticket != null && 
                    ticket.status == TicketStatus.submitted;

    return Scaffold(
      backgroundColor: _offWhite,
      appBar: AppBar(
        backgroundColor: _indigo,
        foregroundColor: Colors.white,
        title: const Text('Maintenance Details', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
        actions: [
          // Only show Edit button for Tenants with Submitted status
          if (canEdit)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit Ticket',
              onPressed: _navigateToEdit,
            ),
        ],
      ),
      body: _isLoading && ticket == null
          ? const Center(child: CircularProgressIndicator(color: _indigo))
          : _error != null && ticket == null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade700)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _fetchDetails,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : ticket == null
                  ? const Center(child: Text('Ticket not found.'))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Status & Unit Card
                          Card(
                            color: Colors.white,
                            child: Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                        decoration: BoxDecoration(
                                          color: _indigo.withAlpha(20),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          ticket.unitNumber.isNotEmpty ? 'Unit ${ticket.unitNumber}' : 'My Unit',
                                          style: const TextStyle(
                                            color: _indigo,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                      Row(
                                        children: [
                                          UrgencyBadge(urgency: ticket.urgencyLevel),
                                          const SizedBox(width: 8),
                                          StatusBadge(status: ticket.status),
                                        ],
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  const Divider(height: 1),
                                  const SizedBox(height: 14),

                                  Row(
                                    children: [
                                      Icon(Icons.calendar_today_outlined, size: 15, color: Colors.grey.shade600),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Submitted: ${DateFormat('MMMM d, yyyy · h:mm a').format(ticket.createdAtIst)}',
                                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Issue Description Section
                          Card(
                            color: Colors.white,
                            child: Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Issue Description',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _indigo),
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    ticket.description,
                                    style: const TextStyle(fontSize: 14, height: 1.5, color: Color(0xFF374151)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Photos Gallery Section
                          if (ticket.imageUrls.isNotEmpty) ...[
                            Card(
                              color: Colors.white,
                              child: Padding(
                                padding: const EdgeInsets.all(20.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Attached Photos (${ticket.imageUrls.length})',
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _indigo),
                                    ),
                                    const SizedBox(height: 14),
                                    SizedBox(
                                      height: 120,
                                      child: ListView.builder(
                                        scrollDirection: Axis.horizontal,
                                        itemCount: ticket.imageUrls.length,
                                        itemBuilder: (context, index) {
                                          final relativeOrFullUrl = ticket.imageUrls[index];
                                          final fullImageUrl = TicketService.getFullImageUrl(relativeOrFullUrl);

                                          return GestureDetector(
                                            onTap: () {
                                              Navigator.push(
                                                context,
                                                MaterialPageRoute(
                                                  builder: (_) => PhotoViewerScreen(
                                                    imageUrls: ticket.imageUrls,
                                                    initialIndex: index,
                                                  ),
                                                ),
                                              );
                                            },
                                            child: Container(
                                              margin: const EdgeInsets.only(right: 12),
                                              width: 120,
                                              decoration: BoxDecoration(
                                                borderRadius: BorderRadius.circular(12),
                                                border: Border.all(color: Colors.grey.shade300),
                                              ),
                                              child: ClipRRect(
                                                borderRadius: BorderRadius.circular(12),
                                                child: Image.network(
                                                  fullImageUrl,
                                                  fit: BoxFit.cover,
                                                  errorBuilder: (context, error, stackTrace) => Container(
                                                    color: Colors.grey.shade100,
                                                    child: Column(
                                                      mainAxisAlignment: MainAxisAlignment.center,
                                                      children: [
                                                        Icon(Icons.broken_image_outlined, color: Colors.grey.shade400, size: 30),
                                                        const SizedBox(height: 4),
                                                        Text(
                                                          'Image error',
                                                          style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Agent Execution Timeline Logs
                          if (ticket.agentExecutionLogs.isNotEmpty) ...[
                            Card(
                              color: Colors.white,
                              child: Padding(
                                padding: const EdgeInsets.all(20.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Automated System Activity',
                                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _indigo),
                                    ),
                                    const SizedBox(height: 14),
                                    ...ticket.agentExecutionLogs.map((log) {
                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 12.0),
                                        child: Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Container(
                                              margin: const EdgeInsets.only(top: 2),
                                              padding: const EdgeInsets.all(6),
                                              decoration: BoxDecoration(
                                                color: _indigo.withAlpha(15),
                                                shape: BoxShape.circle,
                                              ),
                                              child: const Icon(Icons.smart_toy_outlined, size: 14, color: _indigo),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    log.agentRole,
                                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    log.actionTaken,
                                                    style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    DateFormat('MMMM d, yyyy · h:mm a').format(log.createdAtIst),
                                                    style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    }),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
    );
  }
}
