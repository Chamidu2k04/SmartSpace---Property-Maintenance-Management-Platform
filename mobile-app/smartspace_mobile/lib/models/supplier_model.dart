class SupplierItem {
  final String id;
  final String name;
  final String contactEmail;
  final String? phone;

  const SupplierItem({
    required this.id,
    required this.name,
    required this.contactEmail,
    this.phone,
  });

  factory SupplierItem.fromJson(Map<String, dynamic> json) {
    dynamic getField(String camel, String pascal) => json[camel] ?? json[pascal];
    return SupplierItem(
      id: getField('id', 'Id')?.toString() ?? '',
      name: getField('name', 'Name')?.toString() ?? 'Unnamed Supplier',
      contactEmail: getField('contactEmail', 'ContactEmail')?.toString() ?? '',
      phone: getField('phone', 'Phone')?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'contactEmail': contactEmail,
      'phone': phone,
    };
  }
}
