import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/inventory_item.dart';
import '../models/supplier_model.dart';
import '../providers/auth_provider.dart';
import '../providers/inventory_provider.dart';
import '../widgets/qr_part_lookup_widget.dart';

class PartsCatalogScreen extends StatefulWidget {
  const PartsCatalogScreen({super.key});

  @override
  State<PartsCatalogScreen> createState() => _PartsCatalogScreenState();
}

class _PartsCatalogScreenState extends State<PartsCatalogScreen> {
  int _currentTabIndex = 0;

  // Search controllers
  final TextEditingController _partsSearchController = TextEditingController();
  String _partsSearchQuery = '';

  final TextEditingController _supplierSearchController = TextEditingController();
  String _supplierSearchQuery = '';

  static const Color _primaryNavy = Color(0xFF1E3A8A);

  final List<String> _categories = const [
    'All',
    'Plumbing',
    'Electrical',
    'HVAC',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<InventoryProvider>();
      provider.fetchInventory();
      provider.fetchSuppliers();
    });
  }

  @override
  void dispose() {
    _partsSearchController.dispose();
    _supplierSearchController.dispose();
    super.dispose();
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'plumbing':
        return Colors.blue.shade700;
      case 'electrical':
        return Colors.amber.shade800;
      case 'hvac':
        return Colors.teal.shade700;
      default:
        return Colors.indigo.shade700;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'plumbing':
        return Icons.plumbing;
      case 'electrical':
        return Icons.electric_bolt;
      case 'hvac':
        return Icons.ac_unit;
      default:
        return Icons.category;
    }
  }

  int _categoryToInt(String category) {
    switch (category.toLowerCase()) {
      case 'plumbing':
        return 0;
      case 'electrical':
        return 1;
      case 'hvac':
        return 2;
      default:
        return 3;
    }
  }

  // ==========================================
  // PART CRUD DIALOGS & FORMS
  // ==========================================

  void _showAddEditPartBottomSheet(BuildContext context, InventoryItem? existingPart) {
    final isEditing = existingPart != null;
    final nameController = TextEditingController(text: existingPart?.itemName ?? '');
    final stockController = TextEditingController(text: existingPart != null ? existingPart.stockQuantity.toString() : '0');
    final costController = TextEditingController(text: existingPart != null ? existingPart.unitCost.toStringAsFixed(2) : '0.00');

    String selectedCategory = existingPart != null ? existingPart.category : 'Plumbing';
    if (!_categories.contains(selectedCategory) || selectedCategory == 'All') {
      selectedCategory = 'Plumbing';
    }

    final provider = context.read<InventoryProvider>();
    String? selectedSupplierId = existingPart?.supplierId;
    if (selectedSupplierId == null || selectedSupplierId.isEmpty) {
      if (provider.suppliers.isNotEmpty) {
        selectedSupplierId = provider.suppliers.first.id;
      }
    }

    final formKey = GlobalKey<FormState>();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final messenger = ScaffoldMessenger.of(context);
        return StatefulBuilder(
          builder: (innerCtx, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(innerCtx).viewInsets.bottom + 20,
                top: 20,
                left: 20,
                right: 20,
              ),
              child: Form(
                key: formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            isEditing ? 'Edit Spare Part' : 'Add New Spare Part',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: _primaryNavy,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.of(ctx).pop(),
                          ),
                        ],
                      ),
                      const Divider(),
                      const SizedBox(height: 12),

                      // Part Name Field
                      TextFormField(
                        controller: nameController,
                        decoration: InputDecoration(
                          labelText: 'Part Name *',
                          hintText: 'e.g. Copper Pipe 1/2 inch',
                          prefixIcon: const Icon(Icons.inventory_2_outlined, size: 20),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Please enter a part name.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // Category Dropdown
                      DropdownButtonFormField<String>(
                        initialValue: selectedCategory,
                        decoration: InputDecoration(
                          labelText: 'Category *',
                          prefixIcon: const Icon(Icons.category_outlined, size: 20),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        items: ['Plumbing', 'Electrical', 'HVAC'].map((cat) {
                          return DropdownMenuItem(
                            value: cat,
                            child: Row(
                              children: [
                                Icon(_getCategoryIcon(cat), size: 16, color: _getCategoryColor(cat)),
                                const SizedBox(width: 8),
                                Text(cat),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setSheetState(() => selectedCategory = val);
                          }
                        },
                      ),
                      const SizedBox(height: 14),

                      // Supplier Dropdown
                      if (provider.suppliers.isNotEmpty) ...[
                        DropdownButtonFormField<String>(
                          initialValue: selectedSupplierId != null &&
                                  provider.suppliers.any((s) => s.id == selectedSupplierId)
                              ? selectedSupplierId
                              : provider.suppliers.first.id,
                          decoration: InputDecoration(
                            labelText: 'Assigned Supplier *',
                            prefixIcon: const Icon(Icons.business_outlined, size: 20),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          items: provider.suppliers.map((s) {
                            return DropdownMenuItem(
                              value: s.id,
                              child: Text(s.name, overflow: TextOverflow.ellipsis),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setSheetState(() => selectedSupplierId = val);
                            }
                          },
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Stock Quantity & Unit Cost Row
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: stockController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                labelText: 'Stock Quantity *',
                                prefixIcon: const Icon(Icons.inventory_2_outlined, size: 20),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              validator: (val) {
                                if (val == null || val.trim().isEmpty) return 'Enter quantity';
                                final parsed = int.tryParse(val.trim());
                                if (parsed == null || parsed < 0) return 'Invalid qty';
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: costController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: InputDecoration(
                                labelText: 'Unit Cost (Rs.) *',
                                prefixIcon: const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                                  child: Text('Rs.', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: _primaryNavy)),
                                ),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              validator: (val) {
                                if (val == null || val.trim().isEmpty) return 'Enter cost';
                                final parsed = double.tryParse(val.trim());
                                if (parsed == null || parsed < 0) return 'Invalid cost';
                                return null;
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Submit Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _primaryNavy,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: isSubmitting
                              ? null
                              : () async {
                                  if (!formKey.currentState!.validate()) return;
                                  if (selectedSupplierId == null || selectedSupplierId!.isEmpty) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Please select or add a supplier first.')),
                                    );
                                    return;
                                  }

                                  setSheetState(() => isSubmitting = true);

                                  final nav = Navigator.of(ctx);
                                  final provider = context.read<InventoryProvider>();
                                  try {
                                    final catInt = _categoryToInt(selectedCategory);
                                    final qty = int.parse(stockController.text.trim());
                                    final cost = double.parse(costController.text.trim());

                                    if (isEditing) {
                                      await provider.updateInventoryItem(
                                        id: existingPart.id,
                                        supplierId: selectedSupplierId!,
                                        itemName: nameController.text.trim(),
                                        category: catInt,
                                        stockQuantity: qty,
                                        unitCost: cost,
                                      );
                                    } else {
                                      await provider.createInventoryItem(
                                        supplierId: selectedSupplierId!,
                                        itemName: nameController.text.trim(),
                                        category: catInt,
                                        stockQuantity: qty,
                                        unitCost: cost,
                                      );
                                    }

                                    if (mounted) {
                                      nav.pop();
                                      messenger.showSnackBar(
                                        SnackBar(
                                          content: Text(isEditing ? 'Part updated successfully.' : 'Part created successfully.'),
                                          backgroundColor: Colors.green.shade700,
                                        ),
                                      );
                                    }
                                  } catch (e) {
                                    setSheetState(() => isSubmitting = false);
                                    messenger.showSnackBar(
                                      SnackBar(content: Text(e.toString()), backgroundColor: Colors.red.shade700),
                                    );
                                  }
                                },
                          child: isSubmitting
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : Text(
                                  isEditing ? 'Save Changes' : 'Create Spare Part',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showDeletePartDialog(BuildContext context, InventoryItem item) {
    final messenger = ScaffoldMessenger.of(context);
    final provider = context.read<InventoryProvider>();

    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.redAccent),
            SizedBox(width: 8),
            Text('Delete Spare Part'),
          ],
        ),
        content: Text(
          'Are you sure you want to delete "${item.itemName}"?\nThis action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.of(dialogCtx).pop();
              try {
                await provider.deleteInventoryItem(item.id);
                if (mounted) {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text('Deleted "${item.itemName}" successfully.'),
                      backgroundColor: Colors.green.shade700,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(e.toString()),
                      backgroundColor: Colors.red.shade700,
                    ),
                  );
                }
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // SUPPLIER CRUD DIALOGS & FORMS
  // ==========================================

  void _showAddEditSupplierBottomSheet(BuildContext context, SupplierItem? existingSupplier) {
    final isEditing = existingSupplier != null;
    final nameController = TextEditingController(text: existingSupplier?.name ?? '');
    final emailController = TextEditingController(text: existingSupplier?.contactEmail ?? '');
    final phoneController = TextEditingController(text: existingSupplier?.phone ?? '');

    final formKey = GlobalKey<FormState>();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final messenger = ScaffoldMessenger.of(context);
        return StatefulBuilder(
          builder: (innerCtx, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(innerCtx).viewInsets.bottom + 20,
                top: 20,
                left: 20,
                right: 20,
              ),
              child: Form(
                key: formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            isEditing ? 'Edit Supplier' : 'Add New Supplier',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: _primaryNavy,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.of(ctx).pop(),
                          ),
                        ],
                      ),
                      const Divider(),
                      const SizedBox(height: 12),

                      // Supplier Name
                      TextFormField(
                        controller: nameController,
                        decoration: InputDecoration(
                          labelText: 'Company / Supplier Name *',
                          hintText: 'e.g. Kelani Cables PLC',
                          prefixIcon: const Icon(Icons.business_outlined, size: 20),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Please enter the supplier name.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // Contact Email
                      TextFormField(
                        controller: emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: 'Contact Email *',
                          hintText: 'e.g. sales@supplier.com',
                          prefixIcon: const Icon(Icons.email_outlined, size: 20),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Please enter contact email.';
                          }
                          if (!val.contains('@') || !val.contains('.')) {
                            return 'Please enter a valid email address.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // Phone Number
                      TextFormField(
                        controller: phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: 'Phone Number (Optional)',
                          hintText: 'e.g. +94 11 234 5678',
                          prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Submit Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _primaryNavy,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: isSubmitting
                              ? null
                              : () async {
                                  if (!formKey.currentState!.validate()) return;
                                  setSheetState(() => isSubmitting = true);

                                  final nav = Navigator.of(ctx);
                                  final provider = context.read<InventoryProvider>();
                                  try {
                                    if (isEditing) {
                                      await provider.updateSupplier(
                                        id: existingSupplier.id,
                                        name: nameController.text.trim(),
                                        contactEmail: emailController.text.trim(),
                                        phone: phoneController.text.trim().isNotEmpty
                                            ? phoneController.text.trim()
                                            : null,
                                      );
                                    } else {
                                      await provider.createSupplier(
                                        name: nameController.text.trim(),
                                        contactEmail: emailController.text.trim(),
                                        phone: phoneController.text.trim().isNotEmpty
                                            ? phoneController.text.trim()
                                            : null,
                                      );
                                    }

                                    if (mounted) {
                                      nav.pop();
                                      messenger.showSnackBar(
                                        SnackBar(
                                          content: Text(isEditing
                                              ? 'Supplier updated successfully.'
                                              : 'Supplier created successfully.'),
                                          backgroundColor: Colors.green.shade700,
                                        ),
                                      );
                                    }
                                  } catch (e) {
                                    setSheetState(() => isSubmitting = false);
                                    messenger.showSnackBar(
                                      SnackBar(content: Text(e.toString()), backgroundColor: Colors.red.shade700),
                                    );
                                  }
                                },
                          child: isSubmitting
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : Text(
                                  isEditing ? 'Save Changes' : 'Create Supplier',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showDeleteSupplierDialog(BuildContext context, SupplierItem supplier) {
    final messenger = ScaffoldMessenger.of(context);
    final provider = context.read<InventoryProvider>();

    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.redAccent),
            SizedBox(width: 8),
            Text('Delete Supplier'),
          ],
        ),
        content: Text(
          'Are you sure you want to delete "${supplier.name}"?\nNote: Suppliers with associated spare parts cannot be deleted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.of(dialogCtx).pop();
              try {
                await provider.deleteSupplier(supplier.id);
                if (mounted) {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text('Deleted "${supplier.name}" successfully.'),
                      backgroundColor: Colors.green.shade700,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(e.toString()),
                      backgroundColor: Colors.red.shade700,
                      duration: const Duration(seconds: 4),
                    ),
                  );
                }
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showManualLookupDialog() {
    final textController = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.qr_code_scanner, color: _primaryNavy),
            SizedBox(width: 8),
            Text('Scan / Lookup Part QR', style: TextStyle(fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter a Part UUID to simulate a scanned QR code payload:',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: textController,
              decoration: InputDecoration(
                hintText: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
                hintStyle: TextStyle(fontSize: 12, color: Colors.grey.shade400),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _primaryNavy,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              final id = textController.text.trim();
              Navigator.of(dialogCtx).pop();
              showQrPartLookupBottomSheet(context, id);
            },
            child: const Text('Look Up'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: _primaryNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          _currentTabIndex == 0 ? 'Parts & Inventory' : 'Supplier Directory',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 19),
        ),
        actions: [
          if (_currentTabIndex == 0)
            IconButton(
              icon: const Icon(Icons.qr_code_scanner_outlined),
              tooltip: 'Scan Part QR',
              onPressed: _showManualLookupDialog,
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: () {
              final provider = context.read<InventoryProvider>();
              if (_currentTabIndex == 0) {
                provider.fetchInventory();
              } else {
                provider.fetchSuppliers();
              }
            },
          ),
          Consumer<AuthProvider>(
            builder: (context, auth, _) {
              if (!auth.isAuthenticated) return const SizedBox.shrink();
              return IconButton(
                icon: const Icon(Icons.logout),
                tooltip: 'Log Out',
                onPressed: () => auth.logout(),
              );
            },
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTabIndex,
        indicatorColor: _primaryNavy.withValues(alpha: 0.15),
        onDestinationSelected: (index) {
          setState(() {
            _currentTabIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2, color: _primaryNavy),
            label: 'Spare Parts',
          ),
          NavigationDestination(
            icon: Icon(Icons.business_outlined),
            selectedIcon: Icon(Icons.business, color: _primaryNavy),
            label: 'Suppliers',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: _primaryNavy,
        foregroundColor: Colors.white,
        icon: Icon(_currentTabIndex == 0 ? Icons.add_box_outlined : Icons.add_business_outlined),
        label: Text(_currentTabIndex == 0 ? 'Add Spare Part' : 'Add Supplier'),
        onPressed: () {
          if (_currentTabIndex == 0) {
            _showAddEditPartBottomSheet(context, null);
          } else {
            _showAddEditSupplierBottomSheet(context, null);
          }
        },
      ),
      body: _currentTabIndex == 0 ? _buildPartsView() : _buildSuppliersView(),
    );
  }

  // ==========================================
  // VIEW 1: SPARE PARTS CATALOG
  // ==========================================
  Widget _buildPartsView() {
    return Consumer<InventoryProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(_primaryNavy),
                ),
                SizedBox(height: 16),
                Text(
                  'Loading parts catalog...',
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                ),
              ],
            ),
          );
        }

        if (provider.errorMessage != null) {
          return _buildErrorView(provider.errorMessage!, () {
            provider.fetchInventory();
          });
        }

        final allItems = provider.items;
        final categoryFiltered = provider.selectedCategory == 'All'
            ? allItems
            : allItems
                .where((i) =>
                    i.category.toLowerCase() ==
                    provider.selectedCategory.toLowerCase())
                .toList();

        final displayItems = _partsSearchQuery.isEmpty
            ? categoryFiltered
            : categoryFiltered
                .where((i) =>
                    i.itemName
                        .toLowerCase()
                        .contains(_partsSearchQuery.toLowerCase()) ||
                    i.category
                        .toLowerCase()
                        .contains(_partsSearchQuery.toLowerCase()))
                .toList();

        return RefreshIndicator(
          color: _primaryNavy,
          onRefresh: () => provider.fetchInventory(),
          child: Column(
            children: [
              Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Column(
                  children: [
                    _buildUserHeader(),
                    // Search Bar
                    TextField(
                      controller: _partsSearchController,
                      onChanged: (val) {
                        setState(() {
                          _partsSearchQuery = val.trim();
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'Search parts by name or category...',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        suffixIcon: _partsSearchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18),
                                onPressed: () {
                                  _partsSearchController.clear();
                                  setState(() => _partsSearchQuery = '');
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        contentPadding: const EdgeInsets.symmetric(
                            vertical: 0, horizontal: 16),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Category Chips (All, Plumbing, Electrical, HVAC)
                    SizedBox(
                      height: 38,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final cat = _categories[index];
                          final isSelected = provider.selectedCategory == cat;
                          return FilterChip(
                            label: Text(cat),
                            selected: isSelected,
                            onSelected: (_) =>
                                provider.setSelectedCategory(cat),
                            selectedColor: _primaryNavy.withValues(alpha: 0.15),
                            checkmarkColor: _primaryNavy,
                            labelStyle: TextStyle(
                              color: isSelected ? _primaryNavy : Colors.black87,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                              fontSize: 13,
                            ),
                            backgroundColor: Colors.grey.shade100,
                            side: BorderSide(
                              color: isSelected
                                  ? _primaryNavy
                                  : Colors.grey.shade300,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: displayItems.isEmpty
                    ? _buildEmptyState('No Parts Found', 'No spare parts match the selected filter.')
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                        itemCount: displayItems.length,
                        itemBuilder: (context, index) {
                          final item = displayItems[index];
                          return _buildPartCard(item);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ==========================================
  // VIEW 2: SUPPLIER DIRECTORY
  // ==========================================
  Widget _buildSuppliersView() {
    return Consumer<InventoryProvider>(
      builder: (context, provider, child) {
        if (provider.isLoadingSuppliers) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(_primaryNavy),
                ),
                SizedBox(height: 16),
                Text(
                  'Loading supplier directory...',
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                ),
              ],
            ),
          );
        }

        if (provider.supplierErrorMessage != null) {
          return _buildErrorView(provider.supplierErrorMessage!, () {
            provider.fetchSuppliers();
          });
        }

        final allSuppliers = provider.suppliers;
        final displaySuppliers = _supplierSearchQuery.isEmpty
            ? allSuppliers
            : allSuppliers
                .where((s) =>
                    s.name.toLowerCase().contains(_supplierSearchQuery.toLowerCase()) ||
                    s.contactEmail.toLowerCase().contains(_supplierSearchQuery.toLowerCase()) ||
                    (s.phone ?? '').toLowerCase().contains(_supplierSearchQuery.toLowerCase()))
                .toList();

        return RefreshIndicator(
          color: _primaryNavy,
          onRefresh: () => provider.fetchSuppliers(),
          child: Column(
            children: [
              Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Column(
                  children: [
                    _buildUserHeader(),
                    TextField(
                      controller: _supplierSearchController,
                      onChanged: (val) {
                        setState(() {
                          _supplierSearchQuery = val.trim();
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'Search suppliers by name, email, or phone...',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        suffixIcon: _supplierSearchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18),
                                onPressed: () {
                                  _supplierSearchController.clear();
                                  setState(() => _supplierSearchQuery = '');
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        contentPadding: const EdgeInsets.symmetric(
                            vertical: 0, horizontal: 16),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: displaySuppliers.isEmpty
                    ? _buildEmptyState('No Suppliers Found', 'No supplier records match your search query.')
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                        itemCount: displaySuppliers.length,
                        itemBuilder: (context, index) {
                          final supplier = displaySuppliers[index];
                          return _buildSupplierCard(supplier);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildUserHeader() {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        final user = auth.user;
        if (user == null) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: _primaryNavy.withValues(alpha: 0.1),
                child: const Icon(Icons.inventory_2, color: _primaryNavy, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.fullName.isNotEmpty ? user.fullName : 'Inventory Officer',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Colors.black87,
                      ),
                    ),
                    Text(
                      user.email,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.indigo.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Inventory Officer',
                  style: TextStyle(
                    color: Colors.indigo.shade700,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPartCard(InventoryItem item) {
    final catColor = _getCategoryColor(item.category);
    final catIcon = _getCategoryIcon(item.category);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      color: Colors.white,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => showQrPartLookupBottomSheet(context, item.id),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Item Name & Category Badge & Actions
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      item.itemName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: catColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(catIcon, size: 12, color: catColor),
                        const SizedBox(width: 4),
                        Text(
                          item.category,
                          style: TextStyle(
                            color: catColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 4),
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert, size: 20, color: Colors.grey),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    onSelected: (action) {
                      if (action == 'edit') {
                        _showAddEditPartBottomSheet(context, item);
                      } else if (action == 'delete') {
                        _showDeletePartDialog(context, item);
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit_outlined, size: 18, color: Colors.blueAccent),
                            SizedBox(width: 8),
                            Text('Edit Part'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                            SizedBox(width: 8),
                            Text('Delete Part', style: TextStyle(color: Colors.redAccent)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Stock Quantity & Unit Cost Footer
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.inventory_2_outlined,
                        size: 16,
                        color: Colors.grey.shade600,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Stock: ${item.stockQuantity} units',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: item.stockQuantity > 0
                              ? Colors.black87
                              : Colors.red.shade700,
                        ),
                      ),
                      const SizedBox(width: 8),
                      _buildStockBadge(item.stockQuantity),
                    ],
                  ),
                  Text(
                    'Rs. ${item.unitCost.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: _primaryNavy,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSupplierCard(SupplierItem supplier) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: _primaryNavy.withValues(alpha: 0.1),
                  child: const Icon(Icons.business, color: _primaryNavy, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        supplier.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Supplier Partner',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, size: 20, color: Colors.grey),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  onSelected: (action) {
                    if (action == 'edit') {
                      _showAddEditSupplierBottomSheet(context, supplier);
                    } else if (action == 'delete') {
                      _showDeleteSupplierDialog(context, supplier);
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          Icon(Icons.edit_outlined, size: 18, color: Colors.blueAccent),
                          SizedBox(width: 8),
                          Text('Edit Supplier'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                          SizedBox(width: 8),
                          Text('Delete Supplier', style: TextStyle(color: Colors.redAccent)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const Divider(height: 20),
            Row(
              children: [
                Icon(Icons.email_outlined, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    supplier.contactEmail.isNotEmpty
                        ? supplier.contactEmail
                        : 'No email registered',
                    style: TextStyle(
                      fontSize: 13,
                      color: supplier.contactEmail.isNotEmpty
                          ? Colors.black87
                          : Colors.grey,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.phone_outlined, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    supplier.phone != null && supplier.phone!.isNotEmpty
                        ? supplier.phone!
                        : 'No phone number provided',
                    style: TextStyle(
                      fontSize: 13,
                      color: supplier.phone != null && supplier.phone!.isNotEmpty
                          ? Colors.black87
                          : Colors.grey,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStockBadge(int quantity) {
    if (quantity > 10) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: Colors.green.shade50,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          'In Stock',
          style: TextStyle(fontSize: 10, color: Colors.green.shade800, fontWeight: FontWeight.bold),
        ),
      );
    } else if (quantity > 0) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: Colors.orange.shade50,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          'Low Stock',
          style: TextStyle(fontSize: 10, color: Colors.orange.shade900, fontWeight: FontWeight.bold),
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          'Out of Stock',
          style: TextStyle(fontSize: 10, color: Colors.red.shade800, fontWeight: FontWeight.bold),
        ),
      );
    }
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorView(String message, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cloud_off_rounded, size: 64, color: Colors.red.shade400),
            const SizedBox(height: 16),
            const Text(
              'Failed to Load Data',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryNavy,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
