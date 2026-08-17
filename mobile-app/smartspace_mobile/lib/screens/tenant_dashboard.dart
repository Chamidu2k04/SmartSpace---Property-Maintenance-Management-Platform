import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class TenantDashboard extends StatelessWidget {
  const TenantDashboard({super.key});

  static const Color _deepIndigo = Color(0xFF1E3A8A);
  static const Color _emeraldGreen = Color(0xFF10B981);

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: _deepIndigo,
        foregroundColor: Colors.white,
        title: const Text('Tenant Portal', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => authProvider.logout(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Header Card
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16.0),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              color: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: _emeraldGreen,
                      child: Text(
                        user?.fullName.isNotEmpty == true ? user!.fullName[0] : 'T',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.fullName ?? 'Tenant User',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user?.email ?? '',
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Base Shell Notice
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16.0),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              color: Colors.white,
              child: const Padding(
                padding: EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.verified_user_outlined, color: _deepIndigo),
                        SizedBox(width: 8),
                        Text(
                          'Tenant Base App Shell',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: _deepIndigo,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 12),
                    Text(
                      'Welcome to your Tenant dashboard shell. Authentication state and secure JWT token storage are active on this mobile device.',
                      style: TextStyle(color: Colors.black87, height: 1.4),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
