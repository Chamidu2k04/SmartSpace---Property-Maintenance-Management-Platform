import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/ticket_model.dart';
import '../providers/ticket_provider.dart';
import '../widgets/ticket_card.dart';
import 'submit_ticket_screen.dart';
import 'ticket_detail_screen.dart';

class TicketListScreen extends StatefulWidget {
  const TicketListScreen({super.key});

  @override
  State<TicketListScreen> createState() => _TicketListScreenState();
}

class _TicketListScreenState extends State<TicketListScreen> {
  bool _isInit = false;
  static const Color _indigo = Color(0xFF1E3A8A);
  static const Color _offWhite = Color(0xFFFAFAFA);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInit) {
      _isInit = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          context.read<TicketProvider>().loadMyTickets();
        }
      });
    }
  }

  Future<void> _refresh() => context.read<TicketProvider>().loadMyTickets();

  @override
  Widget build(BuildContext context) {
    final ticketProvider = context.watch<TicketProvider>();
    final tickets = ticketProvider.filteredTickets;

    return Scaffold(
      backgroundColor: _offWhite,
      appBar: AppBar(
        backgroundColor: _indigo,
        foregroundColor: Colors.white,
        title: const Text('My Maintenance Requests', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: _refresh,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const SubmitTicketScreen()),
          );
        },
        backgroundColor: _indigo,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Report Issue', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Filter Chips Scroll View
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip(context, label: 'All', status: null),
                  ...TicketStatus.values.map((status) {
                    return _buildFilterChip(context, label: status.displayName, status: status);
                  }),
                ],
              ),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),

          // Main Ticket List Content
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              color: _indigo,
              child: ticketProvider.isLoading
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(color: _indigo),
                          SizedBox(height: 14),
                          Text('Loading tickets...', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  : ticketProvider.errorMessage != null
                      ? ListView(
                          padding: const EdgeInsets.all(24),
                          children: [
                            Card(
                              color: Colors.white,
                              child: Padding(
                                padding: const EdgeInsets.all(24),
                                child: Column(
                                  children: [
                                    const Icon(Icons.error_outline, color: Colors.redAccent, size: 40),
                                    const SizedBox(height: 12),
                                    const Text('Unable to load tickets', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                    const SizedBox(height: 6),
                                    Text(ticketProvider.errorMessage!, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                                    const SizedBox(height: 16),
                                    OutlinedButton.icon(
                                      onPressed: _refresh,
                                      icon: const Icon(Icons.refresh, color: _indigo),
                                      label: const Text('Try Again', style: TextStyle(color: _indigo)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        )
                      : tickets.isEmpty
                          ? ListView(
                              padding: const EdgeInsets.all(24),
                              children: [
                                Card(
                                  color: Colors.white,
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                                    child: Column(
                                      children: [
                                        Container(
                                          width: 60,
                                          height: 60,
                                          decoration: BoxDecoration(
                                            color: _indigo.withAlpha(15),
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                          child: const Icon(Icons.build_outlined, color: _indigo, size: 30),
                                        ),
                                        const SizedBox(height: 16),
                                        const Text(
                                          'No Maintenance Requests',
                                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          ticketProvider.statusFilter != null
                                              ? 'No tickets match the "${ticketProvider.statusFilter!.displayName}" filter.'
                                              : 'You haven\'t submitted any maintenance requests yet. Tap "Report Issue" below to submit one.',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(color: Colors.grey.shade600, fontSize: 13, height: 1.4),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.all(16.0),
                              itemCount: tickets.length,
                              itemBuilder: (context, index) {
                                final ticket = tickets[index];
                                return TicketCard(
                                  ticket: ticket,
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => TicketDetailScreen(ticketId: ticket.id, initialTicket: ticket),
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(BuildContext context, {required String label, required TicketStatus? status}) {
    final ticketProvider = context.watch<TicketProvider>();
    final isSelected = ticketProvider.statusFilter == status;

    return Padding(
      padding: const EdgeInsets.only(right: 6.0),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          ticketProvider.setStatusFilter(selected ? status : null);
        },
        selectedColor: _indigo,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.grey.shade800,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          fontSize: 12,
        ),
        backgroundColor: Colors.grey.shade100,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: isSelected ? _indigo : Colors.grey.shade300),
        ),
        showCheckmark: false,
      ),
    );
  }
}
