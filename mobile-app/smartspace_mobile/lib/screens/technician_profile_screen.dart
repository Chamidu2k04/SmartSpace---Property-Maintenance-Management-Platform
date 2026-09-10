import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/technician_models.dart';
import '../models/user_model.dart';
import '../providers/technician_provider.dart';
import '../providers/auth_provider.dart';

/// Screen for viewing & updating Technician Profiles with Role-Based Access Control
class TechnicianProfileScreen extends StatefulWidget {
  final TechnicianProfile? profile;
  final bool isSelfService;
  final bool isEmbedded;

  const TechnicianProfileScreen({
    super.key,
    this.profile,
    this.isSelfService = false,
    this.isEmbedded = false,
  });

  @override
  State<TechnicianProfileScreen> createState() => _TechnicianProfileScreenState();
}

class _TechnicianProfileScreenState extends State<TechnicianProfileScreen> {
  static const Color _deepIndigo = Color(0xFF1E3A8A);
  static const Color _emeraldGreen = Color(0xFF10B981);
  static const Color _lightBg = Color(0xFFF3F4F6);

  final _formKey = GlobalKey<FormState>();

  late TextEditingController _fullNameController;
  late TextEditingController _emailController;
  late TextEditingController _passwordController;
  late TextEditingController _roleController;
  late TextEditingController _hourlyRateController;

  String _selectedSpecialty = TradeSpecialty.plumber;
  bool _isEditing = false;
  bool _isSaving = false;
  bool _obscurePassword = true;
  String? _inlineError;

  TechnicianProfile? _activeProfile;

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _roleController = TextEditingController();
    _hourlyRateController = TextEditingController();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initProfileData();
    });
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _roleController.dispose();
    _hourlyRateController.dispose();
    super.dispose();
  }

  Future<void> _initProfileData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final techProvider = Provider.of<TechnicianProvider>(context, listen: false);

    if (widget.profile != null) {
      _activeProfile = widget.profile;
    } else {
      final user = authProvider.user;
      if (user != null) {
        if (techProvider.technicians.isEmpty) {
          try {
            await techProvider.loadTechnicians();
          } catch (_) {}
        }
        try {
          _activeProfile = techProvider.technicians.firstWhere(
            (t) =>
                t.id == user.id ||
                t.userId == user.id ||
                (t.email != null && t.email!.toLowerCase() == user.email.toLowerCase()),
          );
        } catch (_) {
          _activeProfile = null;
        }
      }
    }

    final user = authProvider.user;
    _fullNameController.text = _activeProfile?.fullName ?? user?.fullName ?? '';
    _emailController.text = _activeProfile?.email ?? user?.email ?? '';
    _passwordController.clear();
    _roleController.text =
        user?.role == UserRole.propertyManager ? 'Property Manager' : 'Technician';

    final currentRate = _activeProfile?.hourlyRate ?? 0.0;
    _hourlyRateController.text =
        currentRate > 0 ? currentRate.toStringAsFixed(2) : '50.00';
    _selectedSpecialty = TradeSpecialty.normalize(_activeProfile?.tradeSpecialty);
    if (mounted) setState(() {});
  }

  bool _isPropertyManager() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final techProvider = Provider.of<TechnicianProvider>(context, listen: false);
    if (authProvider.user != null) {
      return authProvider.user!.role == UserRole.propertyManager;
    }
    return techProvider.isPropertyManager;
  }

  Future<void> _handleSave() async {
    setState(() {
      _inlineError = null;
    });

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final fullName = _fullNameController.text.trim();
    final email = _emailController.text.trim();
    final rateText = _hourlyRateController.text.trim();
    final parsedRate = double.tryParse(rateText) ?? 0.0;

    if (fullName.isEmpty || email.isEmpty) {
      setState(() => _inlineError = 'Full Name and Email Address are required.');
      return;
    }

    final pwdText = _passwordController.text.trim();
    if (pwdText.isNotEmpty && pwdText.length < 6) {
      setState(() => _inlineError = 'Password must be at least 6 characters long.');
      return;
    }

    // C# backend requires HourlyRate > 0.0 (Range 0.01 - 10000.00).
    // Ensure effectiveRate is always > 0 to prevent HTTP 400 Bad Request.
    final effectiveRate = (parsedRate > 0)
        ? parsedRate
        : ((_activeProfile?.hourlyRate != null && _activeProfile!.hourlyRate > 0)
            ? _activeProfile!.hourlyRate
            : 50.0);

    setState(() => _isSaving = true);
    final techProvider = Provider.of<TechnicianProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    String targetId = _activeProfile?.id ?? '';
    if (targetId.isEmpty) {
      targetId = authProvider.user?.id ?? '';
    }

    final updatePayload = <String, dynamic>{
      'fullName': fullName,
      'email': email,
      'tradeSpecialty': _selectedSpecialty,
      'hourlyRate': effectiveRate,
    };

    if (pwdText.isNotEmpty) {
      updatePayload['password'] = pwdText;
    }

    final success = await techProvider.updateTechnicianProfile(targetId, updatePayload);

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (success) {
      setState(() => _isEditing = false);
      _passwordController.clear();
      _initProfileData();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white, size: 20),
              SizedBox(width: 10),
              Text('Profile updated successfully!'),
            ],
          ),
          backgroundColor: _emeraldGreen,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } else if (techProvider.errorMessage != null) {
      setState(() => _inlineError = techProvider.errorMessage);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isManager = _isPropertyManager();
    final user = authProvider.user;

    final displayName = _fullNameController.text.isNotEmpty
        ? _fullNameController.text
        : (user?.fullName ?? 'Technician User');
    final displayRole = user?.role == UserRole.propertyManager ? 'Property Manager' : 'Technician';

    return Scaffold(
      backgroundColor: _lightBg,
      appBar: widget.isEmbedded
          ? null
          : AppBar(
              backgroundColor: _deepIndigo,
              foregroundColor: Colors.white,
              elevation: 0,
              title: const Text(
                'My Profile Details',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              actions: [
                if (!_isEditing)
                  TextButton.icon(
                    style: TextButton.styleFrom(foregroundColor: Colors.white),
                    onPressed: () => setState(() => _isEditing = true),
                    icon: const Icon(Icons.edit, size: 18),
                    label: const Text('Edit Profile'),
                  )
                else
                  TextButton.icon(
                    style: TextButton.styleFrom(foregroundColor: Colors.white70),
                    onPressed: () {
                      setState(() {
                        _isEditing = false;
                        _inlineError = null;
                      });
                      _initProfileData();
                    },
                    icon: const Icon(Icons.close, size: 18),
                    label: const Text('Cancel'),
                  ),
              ],
            ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card with Avatar & Role / Specialty Badges
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: _deepIndigo,
                        child: Text(
                          displayName.isNotEmpty ? displayName[0].toUpperCase() : 'T',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              displayName,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 8,
                              runSpacing: 4,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: _emeraldGreen.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                        color: _emeraldGreen.withValues(alpha: 0.3)),
                                  ),
                                  child: Text(
                                    'Role: $displayRole',
                                    style: const TextStyle(
                                      color: _emeraldGreen,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: _deepIndigo.withValues(alpha: 0.08),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                        color: _deepIndigo.withValues(alpha: 0.2)),
                                  ),
                                  child: Text(
                                    'Specialty: $_selectedSpecialty',
                                    style: const TextStyle(
                                      color: _deepIndigo,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      if (!_isEditing && widget.isEmbedded)
                        IconButton(
                          icon: const Icon(Icons.edit, color: _deepIndigo),
                          tooltip: 'Edit Profile',
                          onPressed: () => setState(() => _isEditing = true),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Inline Error Card
              if (_inlineError != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _inlineError!,
                          style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Clean Uniform Form Card
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Account & Contact Details',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: _deepIndigo,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 1. Full Name (Editable)
                      TextFormField(
                        controller: _fullNameController,
                        enabled: _isEditing,
                        decoration: InputDecoration(
                          labelText: 'Full Name',
                          prefixIcon: const Icon(Icons.person_outline, size: 20),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: !_isEditing,
                          fillColor: _isEditing ? Colors.white : Colors.grey.shade100,
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Full name is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // 2. Email Address (Editable)
                      TextFormField(
                        controller: _emailController,
                        enabled: _isEditing,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: 'Email Address',
                          prefixIcon: const Icon(Icons.email_outlined, size: 20),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: !_isEditing,
                          fillColor: _isEditing ? Colors.white : Colors.grey.shade100,
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Email address is required';
                          }
                          if (!val.contains('@')) {
                            return 'Enter a valid email address';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // 3. Password (Editable for technician)
                      TextFormField(
                        controller: _passwordController,
                        enabled: _isEditing,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          labelText: _isEditing
                              ? 'Password (Leave blank to keep current)'
                              : 'Password',
                          hintText: _isEditing ? 'Enter new password...' : '••••••••',
                          prefixIcon: const Icon(Icons.lock_outline, size: 20),
                          suffixIcon: _isEditing
                              ? IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_off
                                        : Icons.visibility,
                                    size: 20,
                                    color: Colors.grey,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                )
                              : const Icon(Icons.lock, size: 16, color: Colors.grey),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: !_isEditing,
                          fillColor: _isEditing ? Colors.white : Colors.grey.shade100,
                        ),
                      ),
                      const SizedBox(height: 16),

                      const Divider(height: 24),
                      const Text(
                        'Trade & Role Specifications',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: _deepIndigo,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 4. Trade Specialty (Editable dropdown for Technician & Manager)
                      DropdownButtonFormField<String>(
                        value: TradeSpecialty.values.contains(_selectedSpecialty)
                            ? _selectedSpecialty
                            : TradeSpecialty.plumber,
                        decoration: InputDecoration(
                          labelText: 'Trade Specialty',
                          prefixIcon: const Icon(Icons.handyman_outlined, size: 20),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: !_isEditing,
                          fillColor: _isEditing ? Colors.white : Colors.grey.shade100,
                        ),
                        items: TradeSpecialty.values
                            .map((spec) => DropdownMenuItem(
                                  value: spec,
                                  child: Text(spec),
                                ))
                            .toList(),
                        onChanged: _isEditing
                            ? (val) {
                                if (val != null) {
                                  setState(() => _selectedSpecialty = val);
                                }
                              }
                            : null,
                      ),
                      const SizedBox(height: 16),

                      // 5. Assigned Role (Read-only for Technician, locked with lock icon)
                      TextFormField(
                        controller: _roleController,
                        enabled: _isEditing && isManager,
                        decoration: InputDecoration(
                          labelText: 'Assigned Role',
                          prefixIcon: const Icon(Icons.shield_outlined, size: 20),
                          suffixIcon: (!isManager)
                              ? const Icon(Icons.lock, size: 16, color: Colors.grey)
                              : null,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: !_isEditing || !isManager,
                          fillColor: (_isEditing && isManager)
                              ? Colors.white
                              : Colors.grey.shade100,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 6. Hourly Rate (Rs. / hr) (Read-only for Technician, locked with lock icon)
                      TextFormField(
                        controller: _hourlyRateController,
                        enabled: _isEditing && isManager,
                        keyboardType:
                            const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          labelText: 'Hourly Rate (Rs. / hr)',
                          prefixIcon: const Icon(Icons.attach_money, size: 20),
                          suffixIcon: (!isManager)
                              ? const Icon(Icons.lock, size: 16, color: Colors.grey)
                              : null,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          filled: !_isEditing || !isManager,
                          fillColor: (_isEditing && isManager)
                              ? Colors.white
                              : Colors.grey.shade100,
                        ),
                        validator: (val) {
                          if (_isEditing && isManager) {
                            if (val == null || val.trim().isEmpty) {
                              return 'Hourly rate is required';
                            }
                            final parsed = double.tryParse(val.trim());
                            if (parsed == null || parsed <= 0.0) {
                              return 'Enter a valid rate greater than 0';
                            }
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ),

              // Save & Cancel Actions when Editing
              if (_isEditing) ...[
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: () {
                          setState(() {
                            _isEditing = false;
                            _inlineError = null;
                          });
                          _initProfileData();
                        },
                        child: const Text(
                          'Cancel',
                          style: TextStyle(
                            color: Colors.black87,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _emeraldGreen,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: _isSaving ? null : _handleSave,
                        icon: _isSaving
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.save, size: 18),
                        label: Text(
                          _isSaving ? 'Saving...' : 'Save Changes',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
