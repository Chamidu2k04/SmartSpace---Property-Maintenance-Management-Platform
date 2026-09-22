class PropertyModel {
  final String id;
  final String name;
  final String address;
  final String city;
  final String? imageUrl;
  final List<PropertyUnit> units;

  const PropertyModel({required this.id, required this.name, required this.address, required this.city, this.imageUrl, required this.units});

  factory PropertyModel.fromJson(Map<String, dynamic> json) => PropertyModel(
    id: json['id']?.toString() ?? '',
    name: json['name']?.toString() ?? '',
    address: json['address']?.toString() ?? '',
    city: json['city']?.toString() ?? '',
    imageUrl: json['imageUrl']?.toString(),
    units: (json['units'] as List? ?? []).map((item) => PropertyUnit.fromJson(Map<String, dynamic>.from(item as Map))).toList(),
  );
}

class PropertyUnit {
  final String unitNumber;
  final int floor;
  final String status;

  const PropertyUnit({required this.unitNumber, required this.floor, required this.status});

  factory PropertyUnit.fromJson(Map<String, dynamic> json) => PropertyUnit(
    unitNumber: json['unitNumber']?.toString() ?? '',
    floor: int.tryParse(json['floor']?.toString() ?? '') ?? 0,
    status: json['status']?.toString() ?? 'Vacant',
  );
}
