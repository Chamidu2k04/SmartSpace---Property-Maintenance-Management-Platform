import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smartspace_mobile/models/inventory_item.dart';
import 'package:smartspace_mobile/models/supplier_model.dart';
import 'package:smartspace_mobile/models/user_model.dart';
import 'package:smartspace_mobile/providers/auth_provider.dart';
import 'package:smartspace_mobile/providers/inventory_provider.dart';
import 'package:smartspace_mobile/screens/parts_catalog_screen.dart';
import 'package:smartspace_mobile/services/inventory_service.dart';

/// =========================================================================
/// MOCKS FOR ISOLATED FLUTTER WIDGET TESTING
/// =========================================================================

/// Mock InventoryService to avoid live HTTP API calls during widget testing
class MockInventoryService extends InventoryService {
  final List<InventoryItem> itemsToReturn;
  final List<SupplierItem> suppliersToReturn;

  MockInventoryService({
    this.itemsToReturn = const [],
    this.suppliersToReturn = const [],
  });

  @override
  Future<List<InventoryItem>> fetchInventory({String? category}) async {
    if (category != null && category != 'All') {
      return itemsToReturn
          .where((i) => i.category.toLowerCase() == category.toLowerCase())
          .toList();
    }
    return itemsToReturn;
  }

  @override
  Future<List<SupplierItem>> fetchSuppliers() async {
    return suppliersToReturn;
  }
}

/// Mock AuthProvider implementing authentication state without platform channels
class MockAuthProvider extends ChangeNotifier implements AuthProvider {
  final UserModel? _mockUser;
  final String? _mockToken;

  MockAuthProvider({UserModel? user, String? token})
      : _mockUser = user,
        _mockToken = token;

  @override
  UserModel? get user => _mockUser;

  @override
  String? get token => _mockToken;

  @override
  bool get isAuthenticated => _mockToken != null && _mockToken!.isNotEmpty;

  @override
  bool get isLoading => false;

  @override
  bool get isCheckingAuth => false;

  @override
  String? get errorMessage => null;

  @override
  Future<void> tryRestoreSession() async {}

  @override
  Future<bool> login(String email, String password) async => true;

  @override
  Future<bool> register(String fullName, String email, String password) async => true;

  @override
  Future<void> logout() async {
    notifyListeners();
  }
}

/// =========================================================================
/// FLUTTER WIDGET TEST SUITE: TECHNICIAN PARTS CATALOG
/// Designed for SE3090 Assignment 2 & Quality Management Viva requirements.
/// =========================================================================
void main() {
  final testUser = UserModel(
    id: 'user-tech-101',
    email: 'technician@smartspace.lk',
    fullName: 'Sunil Perera',
    role: UserRole.technician,
  );

  final testItems = [
    const InventoryItem(
      id: 'part-uuid-001',
      supplierId: 'supp-01',
      itemName: 'PVC Elbow Joint 1-inch',
      category: 'Plumbing',
      stockQuantity: 25,
      unitCost: 150.0,
    ),
    const InventoryItem(
      id: 'part-uuid-002',
      supplierId: 'supp-02',
      itemName: 'Miniature Circuit Breaker 10A',
      category: 'Electrical',
      stockQuantity: 12,
      unitCost: 850.0,
    ),
    const InventoryItem(
      id: 'part-uuid-003',
      supplierId: 'supp-01',
      itemName: 'Flexible Hose Pipe 0.5m',
      category: 'Plumbing',
      stockQuantity: 4, // Low stock boundary
      unitCost: 650.0,
    ),
  ];

  Widget createTestWidget({
    required InventoryProvider inventoryProvider,
    required AuthProvider authProvider,
  }) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<InventoryProvider>.value(value: inventoryProvider),
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
      ],
      child: const MaterialApp(
        home: PartsCatalogScreen(),
      ),
    );
  }

  group('Technician Parts Catalog - Widget Tests', () {
    /// VIVA PREP:
    /// What it does: Verifies the initial rendering of the Technician parts catalog screen.
    /// Why written: Confirms the app bar, search input, category chips, and item cards render into the widget tree.
    testWidgets('Renders catalog screen with app title, search bar, and item cards', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final mockService = MockInventoryService(itemsToReturn: testItems);
      final inventoryProvider = InventoryProvider(service: mockService);
      final authProvider = MockAuthProvider(user: testUser, token: 'mock-jwt-token');

      await tester.pumpWidget(createTestWidget(
        inventoryProvider: inventoryProvider,
        authProvider: authProvider,
      ));

      // Trigger post frame callbacks and async data fetch
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Verify AppBar header
      expect(find.text('Parts & Inventory'), findsOneWidget);

      // Verify search input field is present
      expect(find.byType(TextField), findsOneWidget);

      // Verify category filter chips are present
      expect(find.widgetWithText(FilterChip, 'All'), findsOneWidget);
      expect(find.widgetWithText(FilterChip, 'Plumbing'), findsOneWidget);
      expect(find.widgetWithText(FilterChip, 'Electrical'), findsOneWidget);
      expect(find.widgetWithText(FilterChip, 'HVAC'), findsOneWidget);

      // Verify parts are rendered in the list
      expect(find.text('PVC Elbow Joint 1-inch'), findsOneWidget);
      expect(find.text('Miniature Circuit Breaker 10A'), findsOneWidget);
      expect(find.text('Flexible Hose Pipe 0.5m'), findsOneWidget);
    });

    /// VIVA PREP:
    /// What it does: Validates that selecting a category chip filters the parts list to that trade.
    /// Why written: Technicians frequently filter by trade (e.g. Plumbing) when dispatched to specific work orders.
    testWidgets('Filters catalog list when a category chip (e.g. Plumbing) is selected', (WidgetTester tester) async {
      final mockService = MockInventoryService(itemsToReturn: testItems);
      final inventoryProvider = InventoryProvider(service: mockService);
      final authProvider = MockAuthProvider(user: testUser, token: 'mock-jwt-token');

      await tester.pumpWidget(createTestWidget(
        inventoryProvider: inventoryProvider,
        authProvider: authProvider,
      ));

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Initially all parts are visible
      expect(find.text('PVC Elbow Joint 1-inch'), findsOneWidget);
      expect(find.text('Miniature Circuit Breaker 10A'), findsOneWidget);

      // Tap the "Plumbing" FilterChip specifically
      await tester.tap(find.widgetWithText(FilterChip, 'Plumbing'));
      await tester.pumpAndSettle();

      // Only Plumbing items should remain visible
      expect(find.text('PVC Elbow Joint 1-inch'), findsOneWidget);
      expect(find.text('Flexible Hose Pipe 0.5m'), findsOneWidget);

      // Electrical item should now be excluded
      expect(find.text('Miniature Circuit Breaker 10A'), findsNothing);
    });

    /// VIVA PREP:
    /// What it does: Tests search filtering functionality as the user types a search query.
    /// Why written: Validates real-time client-side search filtering on the mobile interface.
    testWidgets('Filters parts in real-time when searching for a part name', (WidgetTester tester) async {
      final mockService = MockInventoryService(itemsToReturn: testItems);
      final inventoryProvider = InventoryProvider(service: mockService);
      final authProvider = MockAuthProvider(user: testUser, token: 'mock-jwt-token');

      await tester.pumpWidget(createTestWidget(
        inventoryProvider: inventoryProvider,
        authProvider: authProvider,
      ));

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Enter search text "Circuit"
      await tester.enterText(find.byType(TextField), 'Circuit');
      await tester.pumpAndSettle();

      // Only Circuit Breaker should be displayed
      expect(find.text('Miniature Circuit Breaker 10A'), findsOneWidget);
      expect(find.text('PVC Elbow Joint 1-inch'), findsNothing);
      expect(find.text('Flexible Hose Pipe 0.5m'), findsNothing);
    });

    /// VIVA PREP:
    /// What it does: Tests empty state presentation when search query returns zero matching parts.
    /// Why written: Proves graceful UI handling when no results are found in the catalog.
    testWidgets('Displays "No Parts Found" empty state when search query matches no parts', (WidgetTester tester) async {
      final mockService = MockInventoryService(itemsToReturn: testItems);
      final inventoryProvider = InventoryProvider(service: mockService);
      final authProvider = MockAuthProvider(user: testUser, token: 'mock-jwt-token');

      await tester.pumpWidget(createTestWidget(
        inventoryProvider: inventoryProvider,
        authProvider: authProvider,
      ));

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Enter query with no matches
      await tester.enterText(find.byType(TextField), 'NonExistentItem999');
      await tester.pumpAndSettle();

      expect(find.text('No Parts Found'), findsOneWidget);
      expect(find.text('No spare parts match the selected filter.'), findsOneWidget);
    });
  });
}
