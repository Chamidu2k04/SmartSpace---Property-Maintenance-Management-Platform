import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user_model.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'tenant_dashboard.dart';
import 'technician_dashboard.dart';

class AuthGateway extends StatelessWidget {
  const AuthGateway({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    if (authProvider.isCheckingAuth) {
      return const Scaffold(
        backgroundColor: Color(0xFFFAFAFA),
        body: Center(
          child: CircularProgressIndicator(
            color: Color(0xFF1E3A8A),
          ),
        ),
      );
    }

    if (!authProvider.isAuthenticated) {
      return const LoginScreen();
    }

    // Role-based Routing Gateway
    final role = authProvider.user?.role;

    if (role == UserRole.Tenant) {
      return const TenantDashboard();
    } else if (role == UserRole.Technician) {
      return const TechnicianDashboard();
    } else {
      return const TenantDashboard();
    }
  }
}
