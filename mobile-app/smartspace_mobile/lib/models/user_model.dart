enum UserRole {
  Tenant,
  PropertyManager,
  Technician,
  InventoryOfficer,
}

class UserModel {
  final String id;
  final String email;
  final String fullName;
  final UserRole role;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['fullName'] ?? '',
      role: _parseRole(json['role']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'role': role.name,
    };
  }

  static UserRole _parseRole(String? roleStr) {
    switch (roleStr?.toLowerCase()) {
      case 'propertymanager':
        return UserRole.PropertyManager;
      case 'technician':
        return UserRole.Technician;
      case 'inventoryofficer':
        return UserRole.InventoryOfficer;
      case 'tenant':
      default:
        return UserRole.Tenant;
    }
  }
}
