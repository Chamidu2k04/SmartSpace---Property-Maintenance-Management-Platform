import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/ticket_provider.dart';
import '../models/ticket_model.dart';
import '../widgets/status_badge.dart';
import '../widgets/urgency_badge.dart';
import 'ticket_detail_screen.dart';

class MaintenanceApprovalsScreen extends StatefulWidget {
  const MaintenanceApprovalsScreen({super.key});

  @override
  State<MaintenanceApprovalsScreen> createState() => _MaintenanceApprovalsScreenState();
}

class _MaintenanceApprovalsScreenState extends State<MaintenanceApprovalsScreen> {
  static const Color _primaryColor = Color(0xFF1E3A8A);
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TicketProvider>().loadAllTickets();
    });
  }

  void _onRefresh() {
    context.read<TicketProvider>().loadAllTickets();
  }

  String _getShortId(String? id) {
    if (id == null || id.isEmpty) return '';
    return '#T-${id.substring(0, 8).toUpperCase()}';
  }

  void _updateStatus(BuildContext context, Ticket ticket, String newStatus) async {
    final provider = context.read<TicketProvider>();
    final success = await provider.updateTicketStatus(
      ticketId: ticket.id,
      newStatus: newStatus,
    );

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Status updated successfully.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.errorMessage ?? 'Failed to update status.'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  void _confirmDelete(BuildContext context, Ticket ticket) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Ticket?'),
        content: Text('Are you sure you want to delete ticket ${_getShortId(ticket.id)}? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final provider = context.read<TicketProvider>();
      final success = await provider.deleteTicket(ticket.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(success ? 'Ticket deleted successfully.' : (provider.errorMessage ?? 'Failed to delete ticket.')),
            backgroundColor: success ? Colors.green : Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      body: Consumer<TicketProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.tickets.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(color: _primaryColor),
            );
          }

          if (provider.errorMessage != null && provider.tickets.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    provider.errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _onRefresh,
                    style: ElevatedButton.styleFrom(backgroundColor: _primaryColor),
                    child: const Text('Try Again'),
                  ),
                ],
              ),
            );
          }

          final allTickets = provider.tickets;
          final total = allTickets.length;
          final submitted = allTickets.where((t) => t.status.toApiString() == 'Submitted').length;
          final inProgress = allTickets.where((t) => ['Analyzing', 'PendingApproval', 'Scheduled'].contains(t.status.toApiString())).length;
          final completed = allTickets.where((t) => t.status.toApiString() == 'Completed').length;

          final filteredTickets = provider.filteredTickets;
          final searchedTickets = _searchQuery.isEmpty
              ? filteredTickets
              : filteredTickets.where((t) {
                  final shortId = _getShortId(t.id).toLowerCase();
                  final tenantName = ((t.tenantName as String?)?.toLowerCase()) ?? '';
                  final query = _searchQuery.toLowerCase().replaceAll('#', '');
                  return shortId.contains(query) ||
                         t.id.toLowerCase().contains(query) ||
                         tenantName.contains(query);
                }).toList();

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Stats Row with inline Refresh button
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
                child: Row(
                  children: [
                    _buildStatCard('Total', total.toString(), Colors.blueGrey),
                    const SizedBox(width: 8),
                    _buildStatCard('Submitted', submitted.toString(), Colors.grey),
                    const SizedBox(width: 8),
                    _buildStatCard('In Progress', inProgress.toString(), Colors.blue),
                    const SizedBox(width: 8),
                    _buildStatCard('Completed', completed.toString(), Colors.green),
                    const SizedBox(width: 4),
                    IconButton(
                      icon: Icon(Icons.refresh, color: _primaryColor, size: 20),
                      tooltip: 'Refresh',
                      onPressed: _onRefresh,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                  ],
                ),
              ),

              // Filter Tabs
              SizedBox(
                height: 48,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    _buildFilterChip(context, provider, 'All', null),
                    _buildFilterChip(context, provider, 'Submitted', 'Submitted'),
                    _buildFilterChip(context, provider, 'Analyzing', 'Analyzing'),
                    _buildFilterChip(context, provider, 'Pending', 'PendingApproval'),
                    _buildFilterChip(context, provider, 'Scheduled', 'Scheduled'),
                    _buildFilterChip(context, provider, 'Completed', 'Completed'),
                  ],
                ),
              ),
              const Divider(height: 1),

              // Search Bar (compact, reduced width)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 40,
                        child: TextField(
                          onChanged: (value) => setState(() => _searchQuery = value.trim()),
                          style: const TextStyle(fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Search by Ticket ID or Tenant Name...',
                            hintStyle: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                            prefixIcon: const Icon(Icons.search, size: 18),
                            suffixIcon: _searchQuery.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear, size: 16),
                                    onPressed: () => setState(() => _searchQuery = ''),
                                  )
                                : null,
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 10),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey.shade300),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey.shade300),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: Color(0xFF1E3A8A), width: 1.5),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Ticket List
              Expanded(
                child: RefreshIndicator(
                  color: _primaryColor,
                  onRefresh: () => provider.loadAllTickets(),
                  child: searchedTickets.isEmpty
                      ? ListView(
                          children: [
                            const SizedBox(height: 100),
                            const Icon(Icons.assignment_outlined, size: 64, color: Colors.grey),
                            const SizedBox(height: 16),
                            Text(
                              _searchQuery.isNotEmpty ? "No tickets found for '$_searchQuery'" : 'No tickets found',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 16, color: Colors.grey, fontWeight: FontWeight.bold),
                            ),
                          ],
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: searchedTickets.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            return _buildTicketCard(context, searchedTickets[index]);
                          },
                        ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatCard(String label, String count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Text(
              count,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(fontSize: 10, color: Colors.black54, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(BuildContext context, TicketProvider provider, String label, String? value) {
    final bool isSelected = (value == null && provider.statusFilter == null) ||
        (provider.statusFilter?.toApiString() == value);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: FilterChip(
        label: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.white : Colors.black87,
          ),
        ),
        selected: isSelected,
        onSelected: (_) {
          provider.setStatusFilter(
            value == null ? null : TicketStatus.values.firstWhere((e) => e.toApiString() == value),
          );
        },
        backgroundColor: Colors.white,
        selectedColor: _primaryColor,
        checkmarkColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: isSelected ? _primaryColor : Colors.grey.shade300),
        ),
      ),
    );
  }

  Widget _buildTicketCard(BuildContext context, Ticket ticket) {
    final dateFormat = DateFormat('MMM d, yyyy');

    return Card(
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TicketDetailScreen(ticketId: ticket.id),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _getShortId(ticket.id),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.black54,
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      Text(
                        'Unit ${(ticket.unitNumber as String?)?.isNotEmpty == true ? ticket.unitNumber : "N/A"}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                        tooltip: 'Delete Ticket',
                        onPressed: () => _confirmDelete(context, ticket),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Description
              Text(
                ticket.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF1A1A1A),
                  height: 1.4,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 12),

              // Sub-info rows
              Row(
                children: [
                  const Icon(Icons.person_outline, size: 14, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(
                    (ticket.tenantName as String?)?.isNotEmpty == true
                        ? ticket.tenantName
                        : 'Unknown Tenant',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF374151),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.calendar_month_outlined, size: 14, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(
                    dateFormat.format(ticket.createdAt),
                    style: const TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Badges
              Row(
                children: [
                  StatusBadge(status: ticket.status),
                  const SizedBox(width: 8),
                  UrgencyBadge(urgency: ticket.urgencyLevel),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 12),

              // Status Dropdown Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Update Status:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.black54,
                    ),
                  ),
                  Container(
                    height: 36,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: ticket.status.toApiString(),
                        icon: const Icon(Icons.arrow_drop_down, size: 18),
                        style: const TextStyle(fontSize: 13, color: Colors.black87, fontWeight: FontWeight.w500),
                        items: const [
                          DropdownMenuItem(value: 'Submitted', child: Text('Submitted')),
                          DropdownMenuItem(value: 'Analyzing', child: Text('Analyzing')),
                          DropdownMenuItem(value: 'PendingApproval', child: Text('PendingApproval')),
                          DropdownMenuItem(value: 'Scheduled', child: Text('Scheduled')),
                          DropdownMenuItem(value: 'Completed', child: Text('Completed')),
                        ],
                        onChanged: (String? newValue) {
                          if (newValue != null && newValue != ticket.status.toApiString()) {
                            _updateStatus(context, ticket, newValue);
                          }
                        },
                      ),
                    ),
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
