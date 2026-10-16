import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smartspace_mobile/services/lease_service.dart';

Map<String, dynamic> validLeaseJson() => {
      'id': 'lease-1',
      'unitId': 'unit-1',
      'unitNumber': 'A-101',
      'propertyName': 'Lakeview Residences',
      'propertyAddress': '24 Lake Road',
      'city': 'Colombo',
      'startDate': '2026-10-01T00:00:00Z',
      'endDate': '2027-09-30T00:00:00Z',
      'monthlyRent': 85000,
      'isActive': true,
    };

void main() {
  group('LeaseService.fetchMyActiveLease', () {
    test('returns the tenant active lease and sends the bearer token',
        () async {
      final client = MockClient((request) async {
        expect(request.url.toString(),
            'https://example.test/api/leases/my-active');
        expect(request.headers['Authorization'], 'Bearer tenant-token');
        return http.Response(
          jsonEncode(validLeaseJson()),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      final service =
          LeaseService(client: client, baseUrl: 'https://example.test/api');

      final lease = await service.fetchMyActiveLease('tenant-token');

      expect(lease, isNotNull);
      expect(lease!.propertyName, 'Lakeview Residences');
      expect(lease.unitNumber, 'A-101');
      expect(lease.monthlyRent, 85000);
      expect(lease.isActive, isTrue);
    });

    test('maps an unauthorized response to a session error', () async {
      final service = LeaseService(
        client: MockClient((_) async => http.Response('', 401)),
        baseUrl: 'https://example.test/api',
      );

      await expectLater(
        service.fetchMyActiveLease('expired-token'),
        throwsA(
          isA<LeaseServiceException>().having(
            (error) => error.message,
            'message',
            contains('cannot access lease details'),
          ),
        ),
      );
    });

  });
}
