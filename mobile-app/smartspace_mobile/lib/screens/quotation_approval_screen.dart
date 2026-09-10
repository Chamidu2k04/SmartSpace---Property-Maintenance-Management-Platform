import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/technician_models.dart';
import '../models/user_model.dart';
import '../providers/technician_provider.dart';
import '../providers/auth_provider.dart';

/// Screen for Property Managers to view cost breakdowns, search & create/approve quotations (FR10)
class QuotationApprovalScreen extends StatefulWidget {
  final bool isEmbedded;

  const QuotationApprovalScreen({
    super.key,
    this.isEmbedded = false,
  });

  @override
  State<QuotationApprovalScreen> createState() => _QuotationApprovalScreenState();
}

class _QuotationApprovalScreenState extends State<QuotationApprovalScreen> {
  // Color Palette matching React Web UI
  static const Color _deepIndigo = Color(0xFF1E3A8A);
  static const Color _emeraldGreen = Color(0xFF10B981);
  static const Color _lightBg = Color(0xFFF3F4F6);

  String _filterStatus = 'All'; // 'All' | 'Pending' | 'Approved'
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
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
    await provider.loadAllData();
  }

  Future<void> _handleApproveQuotation(Quotation quotation) async {
    final provider = Provider.of<TechnicianProvider>(context, listen: false);

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_outline, color: _emeraldGreen, size: 24),
            SizedBox(width: 8),
            Text('Approve Quotation?'),
          ],
        ),
        content: Text(
          'Are you sure you want to approve quotation for Ticket ID:\n"${quotation.ticketId}"?\n\nTotal Amount: Rs. ${quotation.totalCost.toStringAsFixed(2)}',
          style: const TextStyle(height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _emeraldGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Approve & Dispatch Notification'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final success = await provider.approveQuotation(quotation.id);

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.mark_email_read, color: Colors.white, size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Quotation Approved! Confirmation emails dispatched to Tenant & Technician.',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          backgroundColor: _emeraldGreen,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
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

  /// Dialog to Create a New Maintenance Cost Quotation
  void _showCreateQuotationDialog() {
    final provider = Provider.of<TechnicianProvider>(context, listen: false);

    // Filter active scheduled appointments (excluding Cancelled & tickets with existing quotations)
    final existingQuotationTicketIds = provider.quotations
        .map((q) => q.ticketId.toLowerCase().trim())
        .toSet();

    final activeApps = provider.appointments.where((app) {
      final isCancelled = app.status.toLowerCase() == 'cancelled' || app.status == '3';
      final hasQuotation = existingQuotationTicketIds.contains(app.ticketId.toLowerCase().trim());
      return !isCancelled && !hasQuotation;
    }).toList();

    final ticketsMap = <String, MaintenanceTicket>{};
    for (final t in provider.tickets) {
      ticketsMap[t.id.toLowerCase().trim()] = t;
    }

    final scheduledTickets = activeApps.map((app) {
      final matchingTicket = ticketsMap[app.ticketId.toLowerCase().trim()];
      final unit = matchingTicket?.unitNumber ?? 'N/A';
      final desc = (matchingTicket?.description.isNotEmpty == true)
          ? matchingTicket!.description
          : 'Scheduled Maintenance Job';
      final shortDesc = desc.length > 25 ? '${desc.substring(0, 25)}...' : desc;
      return {
        'id': app.ticketId,
        'label': 'Unit $unit - $shortDesc (${app.scheduledDate})',
      };
    }).toList();

    String selectedTicketId = scheduledTickets.isNotEmpty ? scheduledTickets.first['id']! : '';
    final manualTicketIdController = TextEditingController();
    final laborCostController = TextEditingController();
    final partsCostController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final labor = double.tryParse(laborCostController.text.trim()) ?? 0.0;
            final parts = double.tryParse(partsCostController.text.trim()) ?? 0.0;
            final total = labor + parts;

            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _deepIndigo.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.request_quote, color: _deepIndigo, size: 22),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Create Quotation',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select Scheduled Maintenance Ticket *',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                      ),
                      const SizedBox(height: 6),
                      if (scheduledTickets.isNotEmpty) ...[
                        DropdownButtonFormField<String>(
                          initialValue: selectedTicketId.isNotEmpty ? selectedTicketId : null,
                          isExpanded: true,
                          style: const TextStyle(fontSize: 13, color: Colors.black87),
                          decoration: InputDecoration(
                            prefixIcon: const Icon(Icons.confirmation_number_outlined, size: 20),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          ),
                          items: scheduledTickets.map((t) {
                            return DropdownMenuItem<String>(
                              value: t['id'],
                              child: Text(
                                t['label']!,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setDialogState(() {
                                selectedTicketId = val;
                              });
                            }
                          },
                          validator: (val) {
                            if (val == null || val.isEmpty) {
                              return 'Please select a ticket';
                            }
                            return null;
                          },
                        ),
                      ] else ...[
                        Container(
                          padding: const EdgeInsets.all(10),
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: Colors.amber.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.amber.shade200),
                          ),
                          child: Text(
                            'Notice: No active scheduled appointments found. You may type a Ticket GUID manually:',
                            style: TextStyle(fontSize: 11, color: Colors.amber.shade900, fontWeight: FontWeight.w600),
                          ),
                        ),
                        TextFormField(
                          controller: manualTicketIdController,
                          style: const TextStyle(fontSize: 13, fontFamily: 'monospace'),
                          decoration: InputDecoration(
                            hintText: 'Enter Maintenance Ticket GUID...',
                            hintStyle: TextStyle(fontSize: 12, color: Colors.grey.shade400),
                            prefixIcon: const Icon(Icons.confirmation_number_outlined, size: 20),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Ticket ID is required';
                            }
                            return null;
                          },
                        ),
                      ],
                      const SizedBox(height: 14),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Labor Cost (Rs.) *',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: laborCostController,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  style: const TextStyle(fontSize: 13),
                                  decoration: InputDecoration(
                                    prefixText: 'Rs. ',
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                                  ),
                                  onChanged: (_) => setDialogState(() {}),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Required';
                                    }
                                    final num = double.tryParse(value.trim());
                                    if (num == null || num < 0) {
                                      return 'Invalid';
                                    }
                                    return null;
                                  },
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
                                  'Parts Cost (Rs.) *',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                                ),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: partsCostController,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  style: const TextStyle(fontSize: 13),
                                  decoration: InputDecoration(
                                    prefixText: 'Rs. ',
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                                  ),
                                  onChanged: (_) => setDialogState(() {}),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Required';
                                    }
                                    final num = double.tryParse(value.trim());
                                    if (num == null || num < 0) {
                                      return 'Invalid';
                                    }
                                    return null;
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFAFAFA),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Labor Cost:', style: TextStyle(fontSize: 12, color: Colors.black54)),
                                Text('Rs. ${labor.toStringAsFixed(2)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Parts & Materials:', style: TextStyle(fontSize: 12, color: Colors.black54)),
                                Text('Rs. ${parts.toStringAsFixed(2)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                            const Divider(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total Cost:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _deepIndigo)),
                                Text('Rs. ${total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: _deepIndigo)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogCtx).pop(),
                  child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _deepIndigo,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () async {
                    if (formKey.currentState!.validate()) {
                      final finalTicketId = scheduledTickets.isNotEmpty
                          ? selectedTicketId
                          : manualTicketIdController.text.trim();
                      final laborCost = laborCostController.text.trim();
                      final partsCost = partsCostController.text.trim();
                      final scaffoldMessenger = ScaffoldMessenger.of(context);
                      final prov = Provider.of<TechnicianProvider>(context, listen: false);

                      Navigator.of(dialogCtx).pop();

                      final success = await prov.createQuotation({
                        'ticketId': finalTicketId,
                        'laborCost': laborCost,
                        'partsCost': partsCost,
                      });

                      if (!mounted) return;
                      if (success) {
                        scaffoldMessenger.showSnackBar(
                          SnackBar(
                            content: const Row(
                              children: [
                                Icon(Icons.check_circle, color: Colors.white, size: 20),
                                SizedBox(width: 8),
                                Text('New quotation created successfully!'),
                              ],
                            ),
                            backgroundColor: _emeraldGreen,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        );
                      } else if (prov.errorMessage != null) {
                        scaffoldMessenger.showSnackBar(
                          SnackBar(
                            content: Text(prov.errorMessage!),
                            backgroundColor: Colors.redAccent,
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.send, size: 16),
                  label: const Text('Submit Quotation'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  /// Dialog to View Quotation Cost Breakdown Details
  void _showQuotationDetailsDialog(Quotation quotation) {
    showDialog(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _deepIndigo.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.receipt_long, color: _deepIndigo, size: 20),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Quotation Details',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Maintenance Ticket ID',
                  style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
                ),
                SelectableText(
                  quotation.ticketId,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFAFAFA),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Labor Cost:', style: TextStyle(fontSize: 13, color: Colors.black87)),
                          Text('Rs. ${quotation.laborCost.toStringAsFixed(2)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Parts & Materials Cost:', style: TextStyle(fontSize: 13, color: Colors.black87)),
                          Text('Rs. ${quotation.partsCost.toStringAsFixed(2)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        ],
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Divider(height: 1),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Estimated Cost:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _deepIndigo)),
                          Text('Rs. ${quotation.totalCost.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _deepIndigo)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _buildStatusBadge(quotation.isApproved),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogCtx).pop(),
              child: const Text('Close', style: TextStyle(color: Colors.grey)),
            ),
            if (!quotation.isApproved)
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _emeraldGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () {
                  Navigator.of(dialogCtx).pop();
                  _handleApproveQuotation(quotation);
                },
                icon: const Icon(Icons.check_circle_outline, size: 18),
                label: const Text('Approve Quotation'),
              ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<TechnicianProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);

    final isPropertyManager =
        authProvider.user?.role == UserRole.propertyManager || provider.isPropertyManager;

    final filtered = provider.quotations.where((q) {
      final matchesStatus = _filterStatus == 'All'
          ? true
          : _filterStatus == 'Pending'
              ? !q.isApproved
              : q.isApproved;

      final matchesSearch = _searchQuery.isEmpty ||
          q.ticketId.toLowerCase().contains(_searchQuery.toLowerCase().trim());

      return matchesStatus && matchesSearch;
    }).toList();

    if (!isPropertyManager) {
      return Scaffold(
        backgroundColor: _lightBg,
        appBar: AppBar(
          backgroundColor: _deepIndigo,
          foregroundColor: Colors.white,
          elevation: 0,
          title: const Text(
            'Quotations & Approvals',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              color: Colors.white,
              elevation: 0,
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFEF2F2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.shield_outlined, size: 40, color: Colors.redAccent),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Access Restricted',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Quotation approvals and job cost breakdowns are restricted. Full management access is reserved strictly for Property Managers.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.amber.shade200),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.lock_clock, size: 16, color: Colors.amber),
                          SizedBox(width: 6),
                          Text(
                            'Technician Role Restricted',
                            style: TextStyle(
                                fontSize: 12, fontWeight: FontWeight.bold, color: Colors.amber),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

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
                  Icon(Icons.receipt_long, size: 22),
                  SizedBox(width: 10),
                  Text(
                    'Quotations & Approvals',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _loadData,
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateQuotationDialog,
        backgroundColor: _deepIndigo,
        foregroundColor: Colors.white,
        elevation: 3,
        icon: const Icon(Icons.add, size: 20),
        label: const Text('New Quotation', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        color: _deepIndigo,
        onRefresh: _loadData,
        child: Column(
          children: [
            // Search Input Row (Clean full width search bar without duplicate top create button)
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: TextField(
                controller: _searchController,
                onChanged: (val) => setState(() => _searchQuery = val),
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Search by Ticket ID...',
                  hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                  prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 20),
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
                  fillColor: const Color(0xFFF9FAFB),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                ),
              ),
            ),

            // Filter Status Chips Row
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    ChoiceChip(
                      label: const Text('All'),
                      selected: _filterStatus == 'All',
                      selectedColor: _deepIndigo,
                      checkmarkColor: Colors.white,
                      backgroundColor: Colors.grey.shade100,
                      side: BorderSide(
                        color: _filterStatus == 'All' ? _deepIndigo : Colors.grey.shade300,
                      ),
                      labelStyle: TextStyle(
                        color: _filterStatus == 'All' ? Colors.white : Colors.grey.shade800,
                        fontWeight: _filterStatus == 'All' ? FontWeight.bold : FontWeight.normal,
                        fontSize: 13,
                      ),
                      onSelected: (val) => setState(() => _filterStatus = 'All'),
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('Pending Approval'),
                      selected: _filterStatus == 'Pending',
                      selectedColor: Colors.amber.shade700,
                      checkmarkColor: Colors.white,
                      backgroundColor: Colors.grey.shade100,
                      side: BorderSide(
                        color: _filterStatus == 'Pending' ? Colors.amber.shade700 : Colors.grey.shade300,
                      ),
                      labelStyle: TextStyle(
                        color: _filterStatus == 'Pending' ? Colors.white : Colors.grey.shade800,
                        fontWeight: _filterStatus == 'Pending' ? FontWeight.bold : FontWeight.normal,
                        fontSize: 13,
                      ),
                      onSelected: (val) => setState(() => _filterStatus = 'Pending'),
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('Approved'),
                      selected: _filterStatus == 'Approved',
                      selectedColor: _emeraldGreen,
                      checkmarkColor: Colors.white,
                      backgroundColor: Colors.grey.shade100,
                      side: BorderSide(
                        color: _filterStatus == 'Approved' ? _emeraldGreen : Colors.grey.shade300,
                      ),
                      labelStyle: TextStyle(
                        color: _filterStatus == 'Approved' ? Colors.white : Colors.grey.shade800,
                        fontWeight: _filterStatus == 'Approved' ? FontWeight.bold : FontWeight.normal,
                        fontSize: 13,
                      ),
                      onSelected: (val) => setState(() => _filterStatus = 'Approved'),
                    ),
                  ],
                ),
              ),
            ),

            // Main Quotations List View
            Expanded(
              child: provider.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: _deepIndigo),
                    )
                  : provider.errorMessage != null && provider.errorMessage!.isNotEmpty
                      ? _buildErrorState(provider.errorMessage!)
                      : filtered.isEmpty
                          ? _buildEmptyState()
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                return _buildQuotationCard(filtered[index], provider.isLoading);
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuotationCard(Quotation quotation, bool isGlobalLoading) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: quotation.isApproved
              ? _emeraldGreen.withValues(alpha: 0.4)
              : Colors.grey.shade200,
          width: quotation.isApproved ? 1.5 : 1.0,
        ),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Card Header Row: Ticket ID & Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: _deepIndigo.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.build_circle, size: 20, color: _deepIndigo),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Maintenance Ticket ID',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              quotation.ticketId,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                _buildStatusBadge(quotation.isApproved),
              ],
            ),
            const Divider(height: 24),

            // Itemized Cost Breakdown Section
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFAFAFA),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.handyman, size: 16, color: Colors.grey),
                          SizedBox(width: 6),
                          Text('Labor Cost:', style: TextStyle(fontSize: 13, color: Colors.black87)),
                        ],
                      ),
                      Text(
                        'Rs. ${quotation.laborCost.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.inventory_2, size: 16, color: Colors.grey),
                          SizedBox(width: 6),
                          Text('Parts & Materials Cost:', style: TextStyle(fontSize: 13, color: Colors.black87)),
                        ],
                      ),
                      Text(
                        'Rs. ${quotation.partsCost.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Divider(height: 1),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Estimated Cost:',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: _deepIndigo,
                        ),
                      ),
                      Text(
                        'Rs. ${quotation.totalCost.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: _deepIndigo,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Action Button Bar with Details View & Approve Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showQuotationDetailsDialog(quotation),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.black87,
                      side: BorderSide(color: Colors.grey.shade300),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    icon: const Icon(Icons.visibility_outlined, size: 18),
                    label: const Text('View Details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  ),
                ),
                if (!quotation.isApproved) ...[
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 1,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _emeraldGreen,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: isGlobalLoading
                          ? null
                          : () => _handleApproveQuotation(quotation),
                      icon: const Icon(Icons.check_circle_outline, size: 18),
                      label: const Text(
                        'Approve',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ] else ...[
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 1,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _emeraldGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: _emeraldGreen.withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle, color: _emeraldGreen, size: 16),
                          SizedBox(width: 6),
                          Text(
                            'Confirmed',
                            style: TextStyle(
                              color: _emeraldGreen,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(bool isApproved) {
    final bg = isApproved ? _emeraldGreen.withValues(alpha: 0.12) : Colors.amber.shade100;
    final fg = isApproved ? _emeraldGreen : Colors.amber.shade900;
    final label = isApproved ? 'Approved' : 'Pending Approval';
    final icon = isApproved ? Icons.check_circle : Icons.hourglass_top;

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
            label,
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

  Widget _buildEmptyState() {
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
              child: Icon(Icons.request_quote_outlined, size: 48, color: Colors.grey.shade400),
            ),
            const SizedBox(height: 16),
            const Text(
              'No Quotations Found',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isNotEmpty
                  ? 'No quotations match "$_searchQuery".'
                  : _filterStatus != 'All'
                      ? 'No quotations match the selected status filter.'
                      : 'There are currently no job cost quotations in the system.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _showCreateQuotationDialog,
              style: ElevatedButton.styleFrom(
                backgroundColor: _deepIndigo,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Create New Quotation'),
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
              'Failed to Load Quotations',
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
