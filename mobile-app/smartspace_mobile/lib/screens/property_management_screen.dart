import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../models/property_model.dart';
import '../services/property_service.dart';

class PropertyManagementScreen extends StatefulWidget {
  const PropertyManagementScreen({super.key});

  @override
  State<PropertyManagementScreen> createState() =>
      _PropertyManagementScreenState();
}

class _PropertyManagementScreenState extends State<PropertyManagementScreen> {
  final _service = PropertyService();
  late Future<List<PropertyModel>> _properties = _service.getProperties();

  void _refresh() {
    setState(() => _properties = _service.getProperties());
  }

  Future<void> _openPropertyDialog([PropertyModel? property]) async {
    final saved = await showDialog<bool>(
      context: context,
      builder: (_) => _PropertyDialog(property: property),
    );
    if (saved == true) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FC),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openPropertyDialog,
        backgroundColor: const Color(0xFF1E3A8A),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add Property'),
      ),
      body: FutureBuilder<List<PropertyModel>>(
        future: _properties,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      snapshot.error.toString().replaceFirst('Exception: ', ''),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _refresh,
                      child: const Text('Try Again'),
                    ),
                  ],
                ),
              ),
            );
          }

          final properties = snapshot.data ?? [];
          return RefreshIndicator(
            onRefresh: () async => _refresh(),
            child: properties.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: const [
                      SizedBox(height: 220),
                      Center(
                        child: Text(
                          'No properties yet. Add your first property.',
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    itemCount: properties.length,
                    itemBuilder: (context, index) {
                      final property = properties[index];
                      return Card(
                        clipBehavior: Clip.antiAlias,
                        margin: const EdgeInsets.only(bottom: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (property.imageUrl?.isNotEmpty == true)
                              Image.network(
                                property.imageUrl!,
                                height: 170,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => const SizedBox(
                                  height: 100,
                                  child: Center(
                                    child: Icon(Icons.broken_image_outlined),
                                  ),
                                ),
                              ),
                            ListTile(
                              title: Text(
                                property.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              subtitle: Text(
                                '${property.address}, ${property.city}',
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Chip(
                                    label: Text('${property.units.length} units'),
                                  ),
                                  IconButton(
                                    tooltip: 'Edit property',
                                    onPressed: () =>
                                        _openPropertyDialog(property),
                                    icon: const Icon(Icons.edit_outlined),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          );
        },
      ),
    );
  }
}

class _PropertyDialog extends StatefulWidget {
  final PropertyModel? property;

  const _PropertyDialog({this.property});

  @override
  State<_PropertyDialog> createState() => _PropertyDialogState();
}

class _PropertyDialogState extends State<_PropertyDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _address;
  late final TextEditingController _city;
  late final TextEditingController _unit;
  late final TextEditingController _floor;
  XFile? _image;
  Uint8List? _preview;
  bool _saving = false;
  String? _error;

  bool get _isEditing => widget.property != null;

  @override
  void initState() {
    super.initState();
    final property = widget.property;
    _name = TextEditingController(text: property?.name ?? '');
    _address = TextEditingController(text: property?.address ?? '');
    _city = TextEditingController(text: property?.city ?? '');
    _unit = TextEditingController();
    _floor = TextEditingController(text: '0');
  }

  @override
  void dispose() {
    _name.dispose();
    _address.dispose();
    _city.dispose();
    _unit.dispose();
    _floor.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final image = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1800,
      );
      if (image == null) return;
      final bytes = await image.readAsBytes();
      if (bytes.length > 10 * 1024 * 1024) {
        if (mounted) {
          setState(() => _error = 'The image must be 10 MB or smaller.');
        }
        return;
      }
      if (mounted) {
        setState(() {
          _image = image;
          _preview = bytes;
          _error = null;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not open the photo library.');
      }
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      final service = PropertyService();
      if (_isEditing) {
        await service.updateProperty(
          id: widget.property!.id,
          name: _name.text,
          address: _address.text,
          city: _city.text,
          image: _image,
        );
      } else {
        await service.createProperty(
          name: _name.text,
          address: _address.text,
          city: _city.text,
          unitNumber: _unit.text,
          floor: int.parse(_floor.text),
          image: _image,
        );
      }
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString().replaceFirst('Exception: ', '');
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final existingImage = widget.property?.imageUrl;
    return AlertDialog(
      title: Text(_isEditing ? 'Edit Property' : 'Add Property'),
      content: SizedBox(
        width: 500,
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                InkWell(
                  onTap: _saving ? null : _pickImage,
                  child: Container(
                    height: 140,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: _preview != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(11),
                            child: Image.memory(_preview!, fit: BoxFit.cover),
                          )
                        : existingImage?.isNotEmpty == true
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(11),
                                child: Image.network(
                                  existingImage!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      const _ImagePrompt(),
                                ),
                              )
                            : const _ImagePrompt(),
                  ),
                ),
                const SizedBox(height: 12),
                _field(_name, 'Property name'),
                _field(_address, 'Street address'),
                _field(_city, 'City'),
                if (!_isEditing) ...[
                  _field(_unit, 'Initial unit number'),
                  TextFormField(
                    controller: _floor,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Floor'),
                    validator: (value) =>
                        (int.tryParse(value ?? '') ?? -1) < 0
                            ? 'Enter a valid floor'
                            : null,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _saving ? null : _submit,
          child: Text(
            _saving
                ? (_isEditing ? 'Saving...' : 'Creating...')
                : (_isEditing ? 'Save Changes' : 'Create'),
          ),
        ),
      ],
    );
  }

  Widget _field(TextEditingController controller, String label) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(labelText: label),
      validator: (value) => value == null || value.trim().isEmpty
          ? '$label is required'
          : null,
    );
  }
}

class _ImagePrompt extends StatelessWidget {
  const _ImagePrompt();

  @override
  Widget build(BuildContext context) {
    return const Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.add_photo_alternate_outlined, size: 36),
        Text('Choose property image (optional)'),
      ],
    );
  }
}
