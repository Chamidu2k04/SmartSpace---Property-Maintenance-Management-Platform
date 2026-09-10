class LeaseModel {
  final String id;
  final String unitId;
  final String unitNumber;
  final String propertyName;
  final String propertyAddress;
  final String city;
  final DateTime startDate;
  final DateTime endDate;
  final double monthlyRent;
  final bool isActive;

  const LeaseModel({
    required this.id,
    required this.unitId,
    required this.unitNumber,
    required this.propertyName,
    required this.propertyAddress,
    required this.city,
    required this.startDate,
    required this.endDate,
    required this.monthlyRent,
    required this.isActive,
  });

  factory LeaseModel.fromJson(Map<String, dynamic> json) {
    return LeaseModel(
      id: json['id']?.toString() ?? '',
      unitId: json['unitId']?.toString() ?? '',
      unitNumber: json['unitNumber']?.toString() ?? '',
      propertyName: json['propertyName']?.toString() ?? '',
      propertyAddress: json['propertyAddress']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      startDate: DateTime.parse(json['startDate'].toString()),
      endDate: DateTime.parse(json['endDate'].toString()),
      monthlyRent: (json['monthlyRent'] as num).toDouble(),
      isActive: json['isActive'] as bool? ?? false,
    );
  }
}
