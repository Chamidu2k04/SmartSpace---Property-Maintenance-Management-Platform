class InventoryItem {
  final String id;
  final String supplierId;
  final String itemName;
  final String category; // 'Plumbing', 'Electrical', 'HVAC', 'General'
  final int stockQuantity;
  final double unitCost;

  const InventoryItem({
    required this.id,
    required this.supplierId,
    required this.itemName,
    required this.category,
    required this.stockQuantity,
    required this.unitCost,
  });

  factory InventoryItem.fromJson(Map<String, dynamic> json) {
    dynamic getField(String camel, String pascal) => json[camel] ?? json[pascal];

    return InventoryItem(
      id: getField('id', 'Id')?.toString() ?? '',
      supplierId: getField('supplierId', 'SupplierId')?.toString() ?? '',
      itemName: getField('itemName', 'ItemName')?.toString() ?? 'Unnamed Part',
      category: _normalizeCategory(getField('category', 'Category')),
      stockQuantity: (getField('stockQuantity', 'StockQuantity') is num)
          ? (getField('stockQuantity', 'StockQuantity') as num).toInt()
          : int.tryParse(getField('stockQuantity', 'StockQuantity')?.toString() ?? '0') ?? 0,
      unitCost: (getField('unitCost', 'UnitCost') is num)
          ? (getField('unitCost', 'UnitCost') as num).toDouble()
          : double.tryParse(getField('unitCost', 'UnitCost')?.toString() ?? '0.0') ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'supplierId': supplierId,
      'itemName': itemName,
      'category': category,
      'stockQuantity': stockQuantity,
      'unitCost': unitCost,
    };
  }

  static String _normalizeCategory(dynamic rawCategory) {
    if (rawCategory == null) return 'General';

    // Handle C# integer enums: 0 = Plumbing, 1 = Electrical, 2 = HVAC, 3 = General
    if (rawCategory is int) {
      switch (rawCategory) {
        case 0:
          return 'Plumbing';
        case 1:
          return 'Electrical';
        case 2:
          return 'HVAC';
        case 3:
          return 'General';
        default:
          return 'General';
      }
    }

    final str = rawCategory.toString().trim();
    final parsedInt = int.tryParse(str);
    if (parsedInt != null) {
      switch (parsedInt) {
        case 0:
          return 'Plumbing';
        case 1:
          return 'Electrical';
        case 2:
          return 'HVAC';
        case 3:
          return 'General';
        default:
          return 'General';
      }
    }

    switch (str.toLowerCase()) {
      case 'plumbing':
        return 'Plumbing';
      case 'electrical':
        return 'Electrical';
      case 'hvac':
        return 'HVAC';
      case 'general':
      default:
        return 'General';
    }
  }

  bool get isInStock => stockQuantity > 0;
  bool get isLowStock => stockQuantity > 0 && stockQuantity <= 5;
}
