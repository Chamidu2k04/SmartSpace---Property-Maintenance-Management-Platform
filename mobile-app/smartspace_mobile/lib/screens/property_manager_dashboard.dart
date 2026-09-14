import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'technician_schedule_screen.dart';
import 'quotation_approval_screen.dart';
import 'technician_management_screen.dart';

/// Dedicated Dashboard Screen for Property Managers (FR9, FR10 & Technician Management)
class PropertyManagerDashboard extends StatefulWidget {
  const PropertyManagerDashboard({super.key});

  @override
  State<PropertyManagerDashboard> createState() => _PropertyManagerDashboardState();
}

class _PropertyManagerDashboardState extends State<PropertyManagerDashboard> {
  int _currentTabIndex = 0;

  static const Color _deepIndigo = Color(0xFF1E3A8A);

  static const List<Widget> _pages = [
    TechnicianScheduleScreen(isEmbedded: true),
    QuotationApprovalScreen(isEmbedded: true),
    TechnicianManagementScreen(isEmbedded: true),
  ];

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: _deepIndigo,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            Icon(
              _currentTabIndex == 0
                  ? Icons.calendar_month
                  : (_currentTabIndex == 1 ? Icons.receipt_long : Icons.engineering),
              size: 22,
            ),
            const SizedBox(width: 10),
            Text(
              _currentTabIndex == 0
                  ? 'Appointments & Scheduling'
                  : (_currentTabIndex == 1
                      ? 'Quotations & Approvals'
                      : 'Technician Management Directory'),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Log Out',
            onPressed: () => authProvider.logout(),
          ),
        ],
      ),

      // Bottom Navigation Bar for Property Manager
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTabIndex,
        indicatorColor: _deepIndigo.withValues(alpha: 0.15),
        onDestinationSelected: (index) {
          setState(() {
            _currentTabIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month, color: _deepIndigo),
            label: 'Schedule',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long, color: _deepIndigo),
            label: 'Quotations',
          ),
          NavigationDestination(
            icon: Icon(Icons.engineering_outlined),
            selectedIcon: Icon(Icons.engineering, color: _deepIndigo),
            label: 'Technicians',
          ),
        ],
      ),

      body: IndexedStack(
        index: _currentTabIndex,
        children: _pages,
      ),
    );
  }
}
