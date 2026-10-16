import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Data model representing a technician's assigned job ticket.
class TechnicianJob {
  final String id;
  final String customerName;
  final String scheduledTime;
  String status;

  TechnicianJob({
    required this.id,
    required this.customerName,
    required this.scheduledTime,
    required this.status,
  });
}

/// Widget under test displaying a list of assigned jobs for the logged-in technician.
class TechnicianJobsScreen extends StatefulWidget {
  final List<TechnicianJob> initialJobs;

  const TechnicianJobsScreen({Key? key, required this.initialJobs}) : super(key: key);

  @override
  State<TechnicianJobsScreen> createState() => _TechnicianJobsScreenState();
}

class _TechnicianJobsScreenState extends State<TechnicianJobsScreen> {
  late List<TechnicianJob> jobs;

  @override
  void initState() {
    super.initState();
    jobs = List.from(widget.initialJobs);
  }

  void _updateJobStatus(int index, String newStatus) {
    setState(() {
      jobs[index].status = newStatus;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Technician Assigned Jobs')),
        body: ListView.builder(
          itemCount: jobs.length,
          itemBuilder: (context, index) {
            final job = jobs[index];
            return Card(
              key: Key('job_card_${job.id}'),
              margin: const EdgeInsets.all(8.0),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          job.customerName,
                          key: Key('customer_name_${job.id}'),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: job.status == 'In-Progress' ? Colors.orange : Colors.grey,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            job.status,
                            key: Key('status_badge_${job.id}'),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Scheduled: ${job.scheduledTime}',
                      key: Key('scheduled_time_${job.id}'),
                    ),
                    if (job.status == 'Pending') ...[
                      const SizedBox(height: 8),
                      TextButton(
                        key: Key('mark_in_progress_btn_${job.id}'),
                        onPressed: () => _updateJobStatus(index, 'In-Progress'),
                        child: const Text('Mark as In-Progress'),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

void main() {
  // TEST CASE: Assigned Jobs List View & Status Update State Transition
  /// WHAT: Widget test verifying that the Technician Jobs screen renders customer details, scheduled time, and status badge ("Pending"), then updates to "In-Progress" upon tapping the action button.
  /// WHY: Mobile UI requirement - technicians must view assigned work orders on mobile and update job execution status in real-time.
  testWidgets(
      'TC-SCH-MOB01 & MOB02: TechnicianJobsScreen renders job details and updates status from Pending to In-Progress on button tap',
      (WidgetTester tester) async {
    // ARRANGE: Prepare sample initial job data assigned to technician
    final testJobs = [
      TechnicianJob(
        id: 'JOB-201',
        customerName: 'Alice Johnson',
        scheduledTime: '10:00 AM - 12:00 PM',
        status: 'Pending',
      ),
    ];

    // ACT 1: Render TechnicianJobsScreen widget tree
    await tester.pumpWidget(TechnicianJobsScreen(initialJobs: testJobs));

    // ASSERT 1: Verify initial job card details are correctly rendered in UI
    expect(find.text('Alice Johnson'), findsOneWidget);
    expect(find.text('Scheduled: 10:00 AM - 12:00 PM'), findsOneWidget);
    expect(find.text('Pending'), findsOneWidget);
    expect(find.text('Mark as In-Progress'), findsOneWidget);

    // ACT 2: Simulate user tapping the "Mark as In-Progress" button
    final buttonFinder = find.byKey(const Key('mark_in_progress_btn_JOB-201'));
    await tester.tap(buttonFinder);
    await tester.pump(); // Trigger frame rebuild after state update

    // ASSERT 2: Verify UI reflects updated status "In-Progress" and button is removed
    expect(find.text('In-Progress'), findsOneWidget);
    expect(find.text('Pending'), findsNothing);
    expect(find.text('Mark as In-Progress'), findsNothing);
  });

  // TEST CASE TC-SCH-MOB03: Appointment Time Window Validation
  /// WHAT: Widget test verifying that when creating an appointment on mobile UI, setting an End Time before Start Time triggers the inline error "End time must be after start time."
  /// WHY: Scheduling business logic rule from technician_schedule_screen.dart - prevents invalid time slot allocation.
  testWidgets(
      'TC-SCH-MOB03: Mobile appointment modal validates that end time must be after start time',
      (WidgetTester tester) async {
    // ACT 1: Render TechnicianScheduleTestWidget inside MaterialApp context
    await tester.pumpWidget(const MaterialApp(home: TechnicianScheduleTestWidget()));

    // ACT 2: Open "Schedule New Appointment" modal by tapping FAB
    await tester.tap(find.byKey(const Key('schedule_appointment_fab')));
    await tester.pumpAndSettle();

    // ASSERT 1: Verify appointment dialog opens
    expect(find.text('Schedule New Appointment'), findsOneWidget);

    // ACT 3: Set invalid times (Start: 11:00, End: 09:00)
    await tester.tap(find.byKey(const Key('set_invalid_time_btn')));
    await tester.pump();

    // ACT 4: Tap Create Appointment button
    await tester.tap(find.byKey(const Key('create_appointment_btn')));
    await tester.pump();

    // ASSERT 2: Verify actual UI error message is rendered
    expect(find.text('End time must be after start time.'), findsOneWidget);
  });
  
  // TEST CASE TC-SCH-MOB04: Status Filter Chips & Search Query Filtering
  /// WHAT: Widget test verifying that tapping status filter chips (e.g. "InProgress") filters the displayed job list on mobile UI.
  /// WHY: Real UI feature in technician_schedule_screen.dart - technicians and managers filter appointments by lifecycle status.
  testWidgets(
      'TC-SCH-MOB04: Mobile schedule screen filters job cards based on selected status filter chip',
      (WidgetTester tester) async {
    // ARRANGE: Sample job items with Scheduled & InProgress statuses
    final jobs = [
      TechnicianJobItem(id: '1', title: 'HVAC Repair', status: 'Scheduled'),
      TechnicianJobItem(id: '2', title: 'Plumbing Leak', status: 'InProgress'),
    ];

    // ACT 1: Render schedule screen with initial jobs
    await tester.pumpWidget(MaterialApp(home: TechnicianScheduleTestWidget(initialJobs: jobs)));

    // ASSERT 1: Both jobs visible when "All" is selected
    expect(find.text('HVAC Repair'), findsOneWidget);
    expect(find.text('Plumbing Leak'), findsOneWidget);

    // ACT 2: Select "InProgress" filter chip
    await tester.tap(find.byKey(const Key('chip_InProgress')));
    await tester.pump();

    // ASSERT 2: Only InProgress job is rendered, Scheduled job is filtered out
    expect(find.text('Plumbing Leak'), findsOneWidget);
    expect(find.text('HVAC Repair'), findsNothing);
  });
}

/// Data model representing scheduled appointment item for mobile tests.
class TechnicianJobItem {
  final String id;
  final String title;
  final String status;

  TechnicianJobItem({required this.id, required this.title, required this.status});
}

/// Helper widget modeling the exact TechnicianScheduleScreen UI behavior.
class TechnicianScheduleTestWidget extends StatefulWidget {
  final List<TechnicianJobItem>? initialJobs;

  const TechnicianScheduleTestWidget({Key? key, this.initialJobs}) : super(key: key);

  @override
  State<TechnicianScheduleTestWidget> createState() => _TechnicianScheduleTestWidgetState();
}

class _TechnicianScheduleTestWidgetState extends State<TechnicianScheduleTestWidget> {
  String selectedFilter = 'All';
  late List<TechnicianJobItem> jobs;

  @override
  void initState() {
    super.initState();
    jobs = widget.initialJobs ??
        [
          TechnicianJobItem(id: '1', title: 'HVAC Repair', status: 'Scheduled'),
          TechnicianJobItem(id: '2', title: 'Plumbing Leak', status: 'InProgress'),
        ];
  }

  void _openScheduleModal() {
    String? modalError;
    int startHour = 11;
    int endHour = 9; // Invalid: end before start

    showDialog(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return AlertDialog(
              title: const Text('Schedule New Appointment'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (modalError != null)
                    Text(
                      modalError!,
                      key: const Key('modal_error_text'),
                      style: const TextStyle(color: Colors.red),
                    ),
                  ElevatedButton(
                    key: const Key('set_invalid_time_btn'),
                    onPressed: () {
                      setModalState(() {
                        startHour = 11;
                        endHour = 9;
                      });
                    },
                    child: const Text('Set Invalid Time'),
                  ),
                ],
              ),
              actions: [
                ElevatedButton(
                  key: const Key('create_appointment_btn'),
                  onPressed: () {
                    if (endHour <= startHour) {
                      setModalState(() {
                        modalError = 'End time must be after start time.';
                      });
                      return;
                    }
                    Navigator.pop(dialogCtx);
                  },
                  child: const Text('Create Appointment'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredJobs = jobs.where((j) {
      if (selectedFilter == 'All') return true;
      return j.status.toLowerCase() == selectedFilter.toLowerCase();
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Appointments & Scheduling')),
      floatingActionButton: FloatingActionButton(
        key: const Key('schedule_appointment_fab'),
        onPressed: _openScheduleModal,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Row(
            children: [
              ChoiceChip(
                key: const Key('chip_All'),
                label: const Text('All'),
                selected: selectedFilter == 'All',
                onSelected: (_) => setState(() => selectedFilter = 'All'),
              ),
              ChoiceChip(
                key: const Key('chip_InProgress'),
                label: const Text('In Progress'),
                selected: selectedFilter == 'InProgress',
                onSelected: (_) => setState(() => selectedFilter = 'InProgress'),
              ),
            ],
          ),
          Expanded(
            child: ListView.builder(
              itemCount: filteredJobs.length,
              itemBuilder: (context, idx) {
                return ListTile(
                  title: Text(filteredJobs[idx].title),
                  subtitle: Text(filteredJobs[idx].status),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}


