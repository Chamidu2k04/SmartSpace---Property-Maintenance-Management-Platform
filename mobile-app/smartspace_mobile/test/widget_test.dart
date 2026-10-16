import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smartspace_mobile/models/lease_model.dart';
import 'package:smartspace_mobile/providers/auth_provider.dart';
import 'package:smartspace_mobile/providers/lease_provider.dart';
import 'package:smartspace_mobile/screens/tenant_dashboard.dart';

class StubLeaseProvider extends LeaseProvider {
  StubLeaseProvider({this.lease});

  final LeaseModel? lease;
  int loadCalls = 0;

  @override
  LeaseModel? get activeLease => lease;

  @override
  bool get isLoading => false;

  @override
  String? get errorMessage => null;

  @override
  Future<void> loadActiveLease(String token) async {
    loadCalls++;
  }
}

Future<AuthProvider> tenantAuthProvider() async {
  FlutterSecureStorage.setMockInitialValues({
    'smartspace_jwt_token': 'test-tenant-token',
    'smartspace_user_id': 'tenant-1',
    'smartspace_user_email': 'nimal@example.com',
    'smartspace_user_name': 'Nimal Perera',
    'smartspace_user_role': 'Tenant',
  });
  final provider = AuthProvider();
  await provider.tryRestoreSession();
  return provider;
}

Widget dashboard(AuthProvider auth, LeaseProvider leases) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthProvider>.value(value: auth),
      ChangeNotifierProvider<LeaseProvider>.value(value: leases),
    ],
    child: const MaterialApp(home: TenantDashboard()),
  );
}

void main() {
  testWidgets('tenant dashboard renders active lease details', (tester) async {
    final auth = await tenantAuthProvider();
    final leases = StubLeaseProvider(
      lease: LeaseModel(
        id: 'lease-1',
        unitId: 'unit-1',
        unitNumber: 'A-101',
        propertyName: 'Lakeview Residences',
        propertyAddress: '24 Lake Road',
        city: 'Colombo',
        startDate: DateTime.utc(2026, 10, 1),
        endDate: DateTime.utc(2027, 9, 30),
        monthlyRent: 85000,
        isActive: true,
      ),
    );

    await tester.pumpWidget(dashboard(auth, leases));
    await tester.pump();

    expect(find.text('Lakeview Residences'), findsOneWidget);
    expect(find.text('A-101'), findsOneWidget);
    expect(find.text('Rs. 85,000'), findsOneWidget);
    expect(find.text('30 Sep 2027'), findsOneWidget);
    expect(find.text('ACTIVE'), findsOneWidget);
    expect(leases.loadCalls, 1);
  });

  testWidgets('tenant dashboard renders the no-active-lease state',
      (tester) async {
    final auth = await tenantAuthProvider();
    final leases = StubLeaseProvider();

    await tester.pumpWidget(dashboard(auth, leases));
    await tester.pump();

    expect(find.text('No Active Lease'), findsOneWidget);
    expect(
      find.textContaining('Your property manager will update this'),
      findsOneWidget,
    );
    expect(leases.loadCalls, 1);
  });
}
