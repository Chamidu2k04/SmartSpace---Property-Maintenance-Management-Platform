import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/technician_models.dart';
import '../providers/technician_provider.dart';

/// Technician Directory & Management Screen for Property Managers
class TechnicianManagementScreen extends StatefulWidget {
  final bool isEmbedded;

  const TechnicianManagementScreen({
    super.key,
    this.isEmbedded = false,
  });

  @override
  State<TechnicianManagementScreen> createState() => _TechnicianManagementScreenState();
}

class _TechnicianManagementScreenState extends State<TechnicianManagementScreen> {
  static const Color _deepIndigo = Color(0xFF1E3A8A);
  static const Color _emeraldGreen = Color(0xFF10B981);
  static const Color _lightBg = Color(0xFFF3F4F6);

  String _searchQuery = '';
  String _selectedSpecialty = 'All';
  String? _deletingId;

  late TextEditingController _searchController;

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
    await provider.loadTechnicians();
  }

  Future<void> _handleDeleteTechnician(TechnicianProfile tech) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.redAccent),
            SizedBox(width: 8),
            Text('Deactivate Profile', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'Are you sure you want to deactivate technician profile for "${tech.fullName ?? "this technician"}"?',
          style: const TextStyle(fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Deactivate', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;
    if (!mounted) return;

    setState(() => _deletingId = tech.id);
    final provider = Provider.of<TechnicianProvider>(context, listen: false);
    final ok = await provider.deleteTechnicianProfile(tech.id);

    if (!mounted) return;
    setState(() => _deletingId = null);

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Technician "${tech.fullName ?? "profile"}" deactivated successfully.'),
          backgroundColor: _emeraldGreen,
          behavior: SnackBarBehavior.floating,
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

  void _openTechnicianModal([TechnicianProfile? existingTech]) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _TechnicianFormModal(existingTech: existingTech),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<TechnicianProvider>(context);

    // Filter list
    final filtered = provider.technicians.where((tech) {
      final mappedSpecialty = TradeSpecialty.normalize(tech.tradeSpecialty);
      final matchesSpecialty =
          _selectedSpecialty == 'All' || mappedSpecialty == _selectedSpecialty;

      final name = (tech.fullName ?? '').toLowerCase();
      final email = (tech.email ?? '').toLowerCase();
      final query = _searchQuery.toLowerCase().trim();
      final matchesSearch = query.isEmpty || name.contains(query) || email.contains(query);

      return matchesSpecialty && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: _lightBg,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openTechnicianModal(),
        backgroundColor: _deepIndigo,
        foregroundColor: Colors.white,
        elevation: 3,
        icon: const Icon(Icons.person_add, size: 20),
        label: const Text('Add Technician', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      appBar: widget.isEmbedded
          ? null
          : AppBar(
              backgroundColor: _deepIndigo,
              foregroundColor: Colors.white,
              elevation: 0,
              title: const Text(
                'Technicians Directory',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ),
      body: RefreshIndicator(
        color: _deepIndigo,
        onRefresh: _loadData,
        child: Column(
          children: [
            // Search Input Container
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: TextField(
                controller: _searchController,
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: 'Search technician name or email...',
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
            ),

            // Specialty Filter Toolbar
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    _buildFilterChip('All', _selectedSpecialty == 'All'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Plumber', _selectedSpecialty == 'Plumber'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Electrician', _selectedSpecialty == 'Electrician'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Handyman', _selectedSpecialty == 'Handyman'),
                  ],
                ),
              ),
            ),

            // Directory List Area
            Expanded(
              child: provider.isLoading
                  ? const Center(child: CircularProgressIndicator(color: _deepIndigo))
                  : provider.errorMessage != null && provider.errorMessage!.isNotEmpty
                      ? _buildErrorState(provider.errorMessage!)
                      : filtered.isEmpty
                          ? _buildEmptyState()
                          : ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                              itemCount: filtered.length,
                              itemBuilder: (ctx, index) {
                                return _buildTechnicianCard(filtered[index]);
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
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.grey.shade800,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 12,
        ),
      ),
      selected: isSelected,
      selectedColor: _deepIndigo,
      checkmarkColor: Colors.white,
      backgroundColor: Colors.grey.shade100,
      side: BorderSide(color: isSelected ? _deepIndigo : Colors.grey.shade300),
      onSelected: (bool selected) {
        if (selected) {
          setState(() => _selectedSpecialty = label);
        }
      },
    );
  }

  Widget _buildTechnicianCard(TechnicianProfile tech) {
    final techName = tech.fullName ?? 'Unnamed Technician';
    final techEmail = tech.email ?? 'No email provided';
    final specialty = TradeSpecialty.normalize(tech.tradeSpecialty);
    final rateStr = tech.hourlyRate.toStringAsFixed(2);
    final isDeleting = _deletingId == tech.id;

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: _deepIndigo.withValues(alpha: 0.1),
              child: Text(
                techName.isNotEmpty ? techName[0].toUpperCase() : 'T',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: _deepIndigo,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    techName,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.email_outlined, size: 13, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          techEmail,
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.build, size: 11, color: Colors.grey),
                            const SizedBox(width: 4),
                            Text(
                              specialty,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: _emeraldGreen.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: _emeraldGreen.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          'Rs. $rateStr / hr',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: _emeraldGreen,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit_outlined, color: _deepIndigo, size: 20),
                  tooltip: 'Edit Profile',
                  onPressed: () => _openTechnicianModal(tech),
                ),
                if (isDeleting)
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.redAccent),
                  )
                else
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                    tooltip: 'Deactivate',
                    onPressed: () => _handleDeleteTechnician(tech),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            Icon(Icons.engineering_outlined, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            const Text(
              'No Technicians Found',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              _searchQuery.isNotEmpty || _selectedSpecialty != 'All'
                  ? 'No technician matches your current search or filter criteria.'
                  : 'No technician profiles registered in the system yet.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: _deepIndigo),
              onPressed: () => _openTechnicianModal(),
              icon: const Icon(Icons.add, color: Colors.white, size: 18),
              label: const Text('Add Technician', style: TextStyle(color: Colors.white)),
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
            const Text('Failed to Load Directory',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Colors.grey)),
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

/// Form Modal Dialog for Creating & Editing Technician Profiles
class _TechnicianFormModal extends StatefulWidget {
  final TechnicianProfile? existingTech;

  const _TechnicianFormModal({this.existingTech});

  @override
  State<_TechnicianFormModal> createState() => _TechnicianFormModalState();
}

class _TechnicianFormModalState extends State<_TechnicianFormModal> {
  static const Color _deepIndigo = Color(0xFF1E3A8A);
  static const Color _emeraldGreen = Color(0xFF10B981);

  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _passwordController;
  late TextEditingController _rateController;

  String _selectedSpecialty = TradeSpecialty.handyman;
  bool _isSubmitting = false;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    final existing = widget.existingTech;
    _nameController = TextEditingController(text: existing?.fullName ?? '');
    _emailController = TextEditingController(text: existing?.email ?? '');
    _passwordController = TextEditingController();
    _rateController = TextEditingController(
      text: existing != null && existing.hourlyRate > 0
          ? existing.hourlyRate.toStringAsFixed(2)
          : '50.00',
    );
    _selectedSpecialty = TradeSpecialty.normalize(existing?.tradeSpecialty);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _rateController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    setState(() => _errorMsg = null);

    if (!_formKey.currentState!.validate()) return;

    final isEditing = widget.existingTech != null;
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final pwd = _passwordController.text.trim();
    final rate = double.tryParse(_rateController.text.trim()) ?? 50.0;

    if (!isEditing && pwd.isEmpty) {
      setState(() => _errorMsg = 'Account password is required.');
      return;
    }

    if (pwd.isNotEmpty && pwd.length < 6) {
      setState(() => _errorMsg = 'Password must be at least 6 characters.');
      return;
    }

    setState(() => _isSubmitting = true);

    final provider = Provider.of<TechnicianProvider>(context, listen: false);

    final payload = <String, dynamic>{
      'fullName': name,
      'email': email,
      'tradeSpecialty': _selectedSpecialty,
      'hourlyRate': rate > 0 ? rate : 50.0,
    };

    if (pwd.isNotEmpty) {
      payload['password'] = pwd;
    }

    bool ok;
    if (isEditing) {
      ok = await provider.updateTechnicianProfile(widget.existingTech!.id, payload);
    } else {
      ok = await provider.createTechnicianProfile(payload);
    }

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (ok) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isEditing
                ? 'Technician profile updated successfully!'
                : 'New technician registered successfully!',
          ),
          backgroundColor: _emeraldGreen,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else if (provider.errorMessage != null) {
      setState(() => _errorMsg = provider.errorMessage);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existingTech != null;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
      contentPadding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
      title: Row(
        children: [
          const Icon(Icons.engineering, color: _deepIndigo),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isEditing ? 'Edit Technician Profile' : 'Add New Technician',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 20),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_errorMsg != null) ...[
                Container(
                  padding: const EdgeInsets.all(10),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    _errorMsg!,
                    style: const TextStyle(color: Colors.redAccent, fontSize: 12),
                  ),
                ),
              ],

              // Full Name
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: 'Full Name *',
                  floatingLabelBehavior: FloatingLabelBehavior.always,
                  prefixIcon: const Icon(Icons.person_outline, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                validator: (val) {
                  if (val == null || val.trim().length < 2) {
                    return 'Full name must be at least 2 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),

              // Email Address
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'Email Address *',
                  floatingLabelBehavior: FloatingLabelBehavior.always,
                  prefixIcon: const Icon(Icons.email_outlined, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                validator: (val) {
                  if (val == null || !val.contains('@')) {
                    return 'Enter a valid email address';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),

              // Password
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: isEditing ? 'Password (Optional)' : 'Account Password *',
                  hintText: isEditing ? 'Leave empty to keep current' : 'Min 6 characters',
                  floatingLabelBehavior: FloatingLabelBehavior.always,
                  prefixIcon: const Icon(Icons.lock_outline, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 12),

              // Trade Specialty
              DropdownButtonFormField<String>(
                value: TradeSpecialty.values.contains(_selectedSpecialty)
                    ? _selectedSpecialty
                    : TradeSpecialty.handyman,
                decoration: InputDecoration(
                  labelText: 'Trade Specialty *',
                  floatingLabelBehavior: FloatingLabelBehavior.always,
                  prefixIcon: const Icon(Icons.handyman_outlined, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                items: TradeSpecialty.values
                    .map((spec) => DropdownMenuItem(
                          value: spec,
                          child: Text(spec),
                        ))
                    .toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedSpecialty = val);
                  }
                },
              ),
              const SizedBox(height: 12),

              // Hourly Rate
              TextFormField(
                controller: _rateController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'Hourly Rate (Rs. / hr) *',
                  floatingLabelBehavior: FloatingLabelBehavior.always,
                  prefixIcon: const Icon(Icons.attach_money, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Hourly rate is required';
                  }
                  final parsed = double.tryParse(val.trim());
                  if (parsed == null || parsed <= 0) {
                    return 'Enter a valid rate greater than 0';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: _deepIndigo,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          onPressed: _isSubmitting ? null : _handleSubmit,
          child: _isSubmitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : Text(
                  isEditing ? 'Update Technician' : 'Add Technician',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
        ),
      ],
    );
  }
}
