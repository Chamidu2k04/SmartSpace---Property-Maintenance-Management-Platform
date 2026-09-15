import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/lease_model.dart';
import '../providers/auth_provider.dart';
import '../providers/lease_provider.dart';
import 'submit_ticket_screen.dart';
import 'ticket_list_screen.dart';

class TenantDashboard extends StatefulWidget {
  const TenantDashboard({super.key});
  @override
  State<TenantDashboard> createState() => _TenantDashboardState();
}

class _TenantDashboardState extends State<TenantDashboard> {
  static const indigo = Color(0xFF1E3A8A);
  static const emerald = Color(0xFF10B981);
  bool _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_loaded) return;
    _loaded = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _refresh();
    });
  }

  Future<void> _refresh() => context
      .read<LeaseProvider>()
      .loadActiveLease(context.read<AuthProvider>().token ?? '');

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final leases = context.watch<LeaseProvider>();
    final user = auth.user;
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: indigo,
        foregroundColor: Colors.white,
        title: const Text('Tenant Portal',
            style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
              tooltip: 'Sign Out',
              icon: const Icon(Icons.logout),
              onPressed: () async {
                context.read<LeaseProvider>().clear();
                await auth.logout();
              })
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: indigo,
        child: ListView(padding: const EdgeInsets.all(20), children: [
          _UserCard(
              name: user?.fullName ?? 'Tenant User', email: user?.email ?? ''),
          const SizedBox(height: 24),
          const Text('My Lease',
              style: TextStyle(
                  fontSize: 19, fontWeight: FontWeight.bold, color: indigo)),
          const SizedBox(height: 4),
          Text('Your current home and rental information',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          const SizedBox(height: 12),
          if (leases.isLoading)
            const _LoadingCard()
          else if (leases.errorMessage != null)
            _ErrorCard(message: leases.errorMessage!, retry: _refresh)
          else if (leases.activeLease == null)
            const _EmptyCard()
          else
            _LeaseCard(lease: leases.activeLease!),
          const SizedBox(height: 24),

          // Maintenance Requests Section
          const Text('Maintenance Requests',
              style: TextStyle(
                  fontSize: 19, fontWeight: FontWeight.bold, color: indigo)),
          const SizedBox(height: 4),
          Text('Report maintenance issues or track repair status',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          const SizedBox(height: 12),
          const _MaintenanceCardSection(),

          const SizedBox(height: 20),
          _SecurityCard(email: user?.email ?? ''),
        ]),
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  final String name;
  final String email;
  const _UserCard({required this.name, required this.email});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: _TenantDashboardState.emerald.withValues(alpha: 0.15),
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : 'T',
              style: const TextStyle(
                color: _TenantDashboardState.emerald,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: _TenantDashboardState.emerald.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _TenantDashboardState.emerald.withValues(alpha: 0.2)),
                      ),
                      child: const Text(
                        'Tenant',
                        style: TextStyle(
                          color: _TenantDashboardState.emerald,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  email,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LeaseCard extends StatelessWidget {
  final LeaseModel lease;
  const _LeaseCard({required this.lease});
  @override
  Widget build(BuildContext context) => Card(
      color: Colors.white,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
              color: _TenantDashboardState.indigo,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
          child: Row(children: [
            Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                    color: Colors.white.withAlpha(30),
                    borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.apartment_rounded,
                    color: Colors.white, size: 27)),
            const SizedBox(width: 14),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text(
                      lease.propertyName.isEmpty
                          ? 'SmartSpace Property'
                          : lease.propertyName,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 3),
                  Text(
                      [lease.propertyAddress, lease.city]
                          .where((value) => value.isNotEmpty)
                          .join(', '),
                      style: TextStyle(
                          color: Colors.white.withAlpha(190), fontSize: 12))
                ])),
            Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                    color: _TenantDashboardState.emerald,
                    borderRadius: BorderRadius.circular(20)),
                child: const Text('ACTIVE',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold))),
          ]),
        ),
        Padding(
            padding: const EdgeInsets.all(20),
            child: Column(children: [
              Row(children: [
                Expanded(
                    child: _Detail(
                        icon: Icons.door_front_door_outlined,
                        label: 'UNIT NUMBER',
                        value: lease.unitNumber)),
                const SizedBox(width: 12),
                Expanded(
                    child: _Detail(
                        icon: Icons.payments_outlined,
                        label: 'MONTHLY RENT',
                        value: 'Rs. ${_money(lease.monthlyRent)}'))
              ]),
              const SizedBox(height: 18),
              const Divider(height: 1),
              const SizedBox(height: 18),
              Row(children: [
                Expanded(
                    child: _Detail(
                        icon: Icons.event_available_outlined,
                        label: 'LEASE START',
                        value: _date(lease.startDate))),
                const SizedBox(width: 12),
                Expanded(
                    child: _Detail(
                        icon: Icons.event_busy_outlined,
                        label: 'LEASE ENDS',
                        value: _date(lease.endDate)))
              ]),
            ])),
      ]));

  static String _date(DateTime value) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${value.day} ${months[value.month - 1]} ${value.year}';
  }

  static String _money(double value) => value
      .round()
      .toString()
      .replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');
}

class _Detail extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _Detail({required this.icon, required this.label, required this.value});
  @override
  Widget build(BuildContext context) =>
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: _TenantDashboardState.indigo, size: 21),
        const SizedBox(width: 9),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: .5,
                  color: Colors.grey.shade500)),
          const SizedBox(height: 3),
          Text(value,
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1F2937)))
        ]))
      ]);
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard();
  @override
  Widget build(BuildContext context) => Card(
      color: Colors.white,
      child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 34),
          child: Column(children: [
            Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(16)),
                child: Icon(Icons.home_work_outlined,
                    color: Colors.grey.shade500, size: 30)),
            const SizedBox(height: 14),
            const Text('No Active Lease',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(
                'You do not have an active lease assigned yet. Your property manager will update this when a unit is assigned.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Colors.grey.shade600, fontSize: 13, height: 1.4))
          ])));
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard();
  @override
  Widget build(BuildContext context) => const Card(
      color: Colors.white,
      child: Padding(
          padding: EdgeInsets.symmetric(vertical: 46),
          child: Column(children: [
            CircularProgressIndicator(color: _TenantDashboardState.indigo),
            SizedBox(height: 14),
            Text('Loading your lease details...',
                style: TextStyle(color: Colors.black54))
          ])));
}

class _ErrorCard extends StatelessWidget {
  final String message;
  final Future<void> Function() retry;
  const _ErrorCard({required this.message, required this.retry});
  @override
  Widget build(BuildContext context) => Card(
      color: Colors.white,
      child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            const Icon(Icons.error_outline, color: Colors.redAccent, size: 38),
            const SizedBox(height: 10),
            const Text('Could not load lease',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 6),
            Text(message,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
            const SizedBox(height: 12),
            OutlinedButton.icon(
                onPressed: retry,
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'))
          ])));
}

class _SecurityCard extends StatelessWidget {
  final String email;
  const _SecurityCard({required this.email});
  @override
  Widget build(BuildContext context) => Card(
      color: Colors.white,
      child: ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
          leading: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                  color: _TenantDashboardState.emerald.withAlpha(20),
                  borderRadius: BorderRadius.circular(11)),
              child: const Icon(Icons.verified_user_outlined,
                  color: _TenantDashboardState.emerald)),
          title: const Text('Secure tenant account',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          subtitle: Text(email,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12))));
}

class _MaintenanceCardSection extends StatelessWidget {
  const _MaintenanceCardSection();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _QuickActionCard(
            icon: Icons.build_circle_outlined,
            iconBg: _TenantDashboardState.indigo.withValues(alpha: 0.12),
            iconColor: _TenantDashboardState.indigo,
            title: 'My Tickets',
            subtitle: 'View & track requests',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const TicketListScreen()),
              );
            },
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: _QuickActionCard(
            icon: Icons.add_a_photo_outlined,
            iconBg: _TenantDashboardState.emerald.withValues(alpha: 0.12),
            iconColor: _TenantDashboardState.emerald,
            title: 'Report Issue',
            subtitle: 'Submit repair request',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SubmitTicketScreen()),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor, size: 24),
              ),
              const SizedBox(height: 14),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey.shade500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

