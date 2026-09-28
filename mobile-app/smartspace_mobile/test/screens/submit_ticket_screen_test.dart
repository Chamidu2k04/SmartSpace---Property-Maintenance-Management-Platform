import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:smartspace_mobile/screens/submit_ticket_screen.dart';
import 'package:smartspace_mobile/providers/ticket_provider.dart';
import 'package:smartspace_mobile/providers/lease_provider.dart';
import 'package:smartspace_mobile/models/lease_model.dart';
import 'package:smartspace_mobile/models/ticket_model.dart';

// Mock Provider classes for testing
class MockLeaseProvider extends ChangeNotifier implements LeaseProvider {
  @override
  LeaseModel? get activeLease => LeaseModel(
        id: 'lease-123',
        unitId: 'unit-123',
        unitNumber: 'A-101',
        propertyName: 'Sunset Apartments',
        propertyAddress: '123 Sunset Blvd',
        city: 'Colombo',
        startDate: DateTime.now(),
        endDate: DateTime.now().add(const Duration(days: 365)),
        monthlyRent: 1500.0,
        isActive: true,
      );

  @override
  bool get isLoading => false;
  
  @override
  String? get errorMessage => null;
  
  @override
  Future<void> loadActiveLease(String token) async {}
  
  @override
  void clear() {}
}

class MockTicketProvider extends ChangeNotifier implements TicketProvider {
  @override
  bool isSubmitting = false;
  
  @override
  String? errorMessage;
  
  @override
  bool get isLoading => false;
  
  @override
  TicketStatus? get statusFilter => null;

  @override
  Future<Ticket?> submitTicket({
    required String unitId,
    required String description,
    required TicketUrgency urgencyLevel,
    List<XFile>? imageFiles,
  }) async {
    return Ticket(
      id: 'ticket-1',
      tenantId: 'tenant-1',
      tenantName: 'John Doe',
      unitId: unitId,
      unitNumber: 'A-101',
      description: description,
      urgencyLevel: urgencyLevel,
      status: TicketStatus.submitted,
      createdAt: DateTime.now(),
      imageUrls: [],
      agentExecutionLogs: [],
    );
  }

  @override
  List<Ticket> get tickets => [];
  
  @override
  List<Ticket> get filteredTickets => [];
  
  @override
  Future<void> loadMyTickets() async {}
  
  @override
  Future<void> loadAllTickets() async {}
  
  @override
  Future<bool> updateTicketStatus({required String ticketId, required String newStatus}) async => true;
  
  @override
  Future<bool> deleteTicket(String ticketId) async => true;
  
  @override
  Future<Ticket?> getTicketById(String id) async => null;
  
  @override
  Future<bool> updateTicket({
    required String ticketId,
    required String description,
    required TicketUrgency urgencyLevel,
  }) async => true;
  
  @override
  void setStatusFilter(TicketStatus? filter) {}
  
  @override
  void clearError() {}
}

void main() {
  Widget createTestWidget() {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<LeaseProvider>(create: (_) => MockLeaseProvider()),
        ChangeNotifierProvider<TicketProvider>(create: (_) => MockTicketProvider()),
      ],
      child: const MaterialApp(
        home: SubmitTicketScreen(),
      ),
    );
  }

  // VIVA PREP: Tests that the ticket submission form renders correctly 
  // with all required UI elements like the description box and urgency selector.
  testWidgets('renders SubmitTicketScreen with essential fields', (WidgetTester tester) async {
    await tester.pumpWidget(createTestWidget());

    // Verify title and description field exist
    expect(find.text('Report Maintenance Issue'), findsOneWidget);
    expect(find.byType(TextFormField), findsOneWidget);
    
    // Verify urgency level options exist
    expect(find.text('Low'), findsOneWidget);
    expect(find.text('Medium'), findsOneWidget);
    expect(find.text('High'), findsOneWidget);
    expect(find.text('Emergency'), findsOneWidget);
    
    // Verify submit button exists
    expect(find.text('Submit Maintenance Request'), findsOneWidget);
  });

  // VIVA PREP: Tests form validation. An empty form should show validation errors
  // preventing submission without required fields (description and urgency).
  testWidgets('shows validation errors on empty submit', (WidgetTester tester) async {
    await tester.pumpWidget(createTestWidget());

    // Tap submit button without filling the form
    await tester.ensureVisible(find.text('Submit Maintenance Request'));
    await tester.tap(find.text('Submit Maintenance Request'));
    await tester.pumpAndSettle(); // Wait for animations and validations

    // Verify description validation error
    expect(find.text('Please enter a description of the issue.'), findsOneWidget);
    
    // Verify urgency selection error (SnackBar or inline text)
    expect(find.text('Please select an urgency level.'), findsWidgets);
  });

  // VIVA PREP: Tests the "normal" happy path where a user fills out the form
  // correctly and submits. We verify that interacting with the fields works.
  testWidgets('allows entering description and selecting urgency', (WidgetTester tester) async {
    await tester.pumpWidget(createTestWidget());

    // Enter text in the description field
    await tester.enterText(find.byType(TextFormField), 'The kitchen sink is leaking heavily.');
    await tester.pump();

    // Verify the text was entered
    expect(find.text('The kitchen sink is leaking heavily.'), findsOneWidget);

    // Select 'Medium' urgency
    await tester.tap(find.text('Medium'));
    await tester.pump();

    // Form should now have valid data.
    // Tapping submit should no longer show the required description error.
    await tester.ensureVisible(find.text('Submit Maintenance Request'));
    await tester.tap(find.text('Submit Maintenance Request'));
    await tester.pump();

    expect(find.text('Please enter a description of the issue.'), findsNothing);
  });
}
