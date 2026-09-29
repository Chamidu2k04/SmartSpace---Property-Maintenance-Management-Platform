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

// =========================================================================
// FLUTTER WIDGET TEST SUITE FOR TECHNICIAN JOBS SCREEN
// =========================================================================

void main() {
  // =========================================================================
  // TEST CASE: Assigned Jobs List View & Status Update State Transition
  // =========================================================================
  /// WHAT: Widget test verifying that the Technician Jobs screen renders customer details, scheduled time, and status badge ("Pending"), then updates to "In-Progress" upon tapping the action button.
  /// WHY: Mobile UI requirement - technicians must view assigned work orders on mobile and update job execution status in real-time.
  /// VIVA TIP: Explain to the examiner how `tester.pumpWidget` inflates the component hierarchy, `find.byKey` verifies rendered strings, and `tester.tap` with `tester.pump()` triggers `setState` state re-rendering.
  testWidgets(
      'TechnicianJobsScreen renders job details and updates status from Pending to In-Progress on button tap',
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
}
