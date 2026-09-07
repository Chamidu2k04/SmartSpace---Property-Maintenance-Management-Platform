import 'package:flutter/foundation.dart';
import '../models/inventory_item.dart';
import '../models/supplier_model.dart';
import '../services/inventory_service.dart';

class InventoryProvider extends ChangeNotifier {
  final InventoryService _service;

  // Parts state
  List<InventoryItem> _items = [];
  InventoryItem? _selectedPart;
  bool _isLoading = false;
  bool _isLookingUp = false;
  bool _isMutating = false; // Add/Edit/Delete in progress
  String? _errorMessage;
  String? _lookupErrorMessage;
  String _selectedCategory = 'All';

  // Suppliers state
  List<SupplierItem> _suppliers = [];
  bool _isLoadingSuppliers = false;
  String? _supplierErrorMessage;

  InventoryProvider({InventoryService? service})
      : _service = service ?? InventoryService();

  // Parts Getters
  List<InventoryItem> get items => _items;
  InventoryItem? get selectedPart => _selectedPart;
  bool get isLoading => _isLoading;
  bool get isLookingUp => _isLookingUp;
  bool get isMutating => _isMutating;
  String? get errorMessage => _errorMessage;
  String? get lookupErrorMessage => _lookupErrorMessage;
  String get selectedCategory => _selectedCategory;

  // Suppliers Getters
  List<SupplierItem> get suppliers => _suppliers;
  bool get isLoadingSuppliers => _isLoadingSuppliers;
  String? get supplierErrorMessage => _supplierErrorMessage;

  List<InventoryItem> get filteredItems {
    if (_selectedCategory == 'All') return _items;
    return _items
        .where((item) =>
            item.category.toLowerCase() == _selectedCategory.toLowerCase())
        .toList();
  }

  void setSelectedCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  // ==========================================
  // INVENTORY PARTS CRUD
  // ==========================================

  /// Fetches the entire inventory catalog.
  Future<void> fetchInventory() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _items = await _service.fetchInventory();
    } on ApiException catch (e) {
      _errorMessage = e.message;
    } catch (e) {
      _errorMessage = 'An unexpected error occurred while loading parts.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Creates a new inventory item.
  Future<bool> createInventoryItem({
    required String supplierId,
    required String itemName,
    required int category, // 0: Plumbing, 1: Electrical, 2: HVAC, 3: General
    required int stockQuantity,
    required double unitCost,
  }) async {
    _isMutating = true;
    notifyListeners();

    try {
      final newItem = await _service.createInventoryItem({
        'supplierId': supplierId,
        'itemName': itemName.trim(),
        'category': category,
        'stockQuantity': stockQuantity,
        'unitCost': unitCost,
      });

      _items.insert(0, newItem);
      _isMutating = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _isMutating = false;
      notifyListeners();
      throw e.message;
    } catch (e) {
      _isMutating = false;
      notifyListeners();
      throw 'Failed to add spare part. Please check inputs.';
    }
  }

  /// Updates an existing inventory item.
  Future<bool> updateInventoryItem({
    required String id,
    required String supplierId,
    required String itemName,
    required int category,
    required int stockQuantity,
    required double unitCost,
  }) async {
    _isMutating = true;
    notifyListeners();

    try {
      final updated = await _service.updateInventoryItem(id, {
        'supplierId': supplierId,
        'itemName': itemName.trim(),
        'category': category,
        'stockQuantity': stockQuantity,
        'unitCost': unitCost,
      });

      final index = _items.indexWhere((i) => i.id == id);
      if (index != -1) {
        _items[index] = updated;
      }
      if (_selectedPart?.id == id) {
        _selectedPart = updated;
      }

      _isMutating = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _isMutating = false;
      notifyListeners();
      throw e.message;
    } catch (e) {
      _isMutating = false;
      notifyListeners();
      throw 'Failed to update spare part.';
    }
  }

  /// Deletes an inventory item.
  Future<bool> deleteInventoryItem(String id) async {
    _isMutating = true;
    notifyListeners();

    try {
      await _service.deleteInventoryItem(id);
      _items.removeWhere((i) => i.id == id);
      if (_selectedPart?.id == id) {
        _selectedPart = null;
      }
      _isMutating = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _isMutating = false;
      notifyListeners();
      throw e.message;
    } catch (e) {
      _isMutating = false;
      notifyListeners();
      throw 'Failed to delete spare part.';
    }
  }

  // ==========================================
  // SUPPLIERS CRUD
  // ==========================================

  /// Fetches all suppliers for the Supplier Directory.
  Future<void> fetchSuppliers() async {
    _isLoadingSuppliers = true;
    _supplierErrorMessage = null;
    notifyListeners();

    try {
      _suppliers = await _service.fetchSuppliers();
    } on ApiException catch (e) {
      _supplierErrorMessage = e.message;
    } catch (e) {
      _supplierErrorMessage = 'An unexpected error occurred while loading suppliers.';
    } finally {
      _isLoadingSuppliers = false;
      notifyListeners();
    }
  }

  /// Creates a new supplier.
  Future<bool> createSupplier({
    required String name,
    required String contactEmail,
    String? phone,
  }) async {
    _isMutating = true;
    notifyListeners();

    try {
      final newSupplier = await _service.createSupplier({
        'name': name.trim(),
        'contactEmail': contactEmail.trim().toLowerCase(),
        'phone': phone?.trim(),
      });

      _suppliers.insert(0, newSupplier);
      _isMutating = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _isMutating = false;
      notifyListeners();
      throw e.message;
    } catch (e) {
      _isMutating = false;
      notifyListeners();
      throw 'Failed to create supplier. Check email duplication.';
    }
  }

  /// Updates an existing supplier.
  Future<bool> updateSupplier({
    required String id,
    required String name,
    required String contactEmail,
    String? phone,
  }) async {
    _isMutating = true;
    notifyListeners();

    try {
      final updated = await _service.updateSupplier(id, {
        'name': name.trim(),
        'contactEmail': contactEmail.trim().toLowerCase(),
        'phone': phone?.trim(),
      });

      final index = _suppliers.indexWhere((s) => s.id == id);
      if (index != -1) {
        _suppliers[index] = updated;
      }

      _isMutating = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _isMutating = false;
      notifyListeners();
      throw e.message;
    } catch (e) {
      _isMutating = false;
      notifyListeners();
      throw 'Failed to update supplier details.';
    }
  }

  /// Deletes a supplier.
  Future<bool> deleteSupplier(String id) async {
    _isMutating = true;
    notifyListeners();

    try {
      await _service.deleteSupplier(id);
      _suppliers.removeWhere((s) => s.id == id);
      _isMutating = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _isMutating = false;
      notifyListeners();
      throw e.message;
    } catch (e) {
      _isMutating = false;
      notifyListeners();
      throw 'Failed to delete supplier.';
    }
  }

  /// Fetches a single part by ID (e.g., from QR scan).
  Future<InventoryItem?> fetchPartById(String id) async {
    _isLookingUp = true;
    _lookupErrorMessage = null;
    _selectedPart = null;
    notifyListeners();

    try {
      final part = await _service.fetchPartById(id);
      _selectedPart = part;
      return part;
    } on ApiException catch (e) {
      _lookupErrorMessage = e.message;
      return null;
    } catch (e) {
      _lookupErrorMessage = 'Failed to load part details. Please try again.';
      return null;
    } finally {
      _isLookingUp = false;
      notifyListeners();
    }
  }

  void clearSelectedPart() {
    _selectedPart = null;
    _lookupErrorMessage = null;
    notifyListeners();
  }

  void clearErrorMessage() {
    _errorMessage = null;
    notifyListeners();
  }
}
