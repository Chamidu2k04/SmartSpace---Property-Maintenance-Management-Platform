import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../models/ticket_model.dart';
import '../providers/lease_provider.dart';
import '../providers/ticket_provider.dart';
import 'ticket_list_screen.dart';

class SubmitTicketScreen extends StatefulWidget {
  const SubmitTicketScreen({super.key});

  @override
  State<SubmitTicketScreen> createState() => _SubmitTicketScreenState();
}

class _SubmitTicketScreenState extends State<SubmitTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  TicketUrgency? _selectedUrgency;
  bool _showUrgencyError = false;
  final List<XFile> _selectedImages = [];
  final ImagePicker _picker = ImagePicker();

  static const Color _indigo = Color(0xFF1E3A8A);
  static const Color _emerald = Color(0xFF10B981);
  static const Color _offWhite = Color(0xFFFAFAFA);

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1600,
      );
      if (photo != null) {
        setState(() {
          _selectedImages.add(photo);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not access camera/gallery: $e')),
        );
      }
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  Future<void> _handleSubmit() async {
    final isFormValid = _formKey.currentState!.validate();

    if (_selectedUrgency == null) {
      setState(() {
        _showUrgencyError = true;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select an urgency level for this issue.'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }

    if (!isFormValid || _selectedUrgency == null) return;

    final leaseProvider = context.read<LeaseProvider>();
    final activeLease = leaseProvider.activeLease;

    if (activeLease == null || activeLease.unitId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No active lease found. Please contact property manager.'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    final ticketProvider = context.read<TicketProvider>();
    final createdTicket = await ticketProvider.submitTicket(
      unitId: activeLease.unitId,
      description: _descriptionController.text.trim(),
      urgencyLevel: _selectedUrgency!,
      imageFiles: _selectedImages,
    );

    if (!mounted) return;

    if (createdTicket != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Maintenance request submitted successfully!'),
          backgroundColor: _emerald,
        ),
      );
      // Navigate to ticket list screen or pop
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const TicketListScreen()),
        );
      }
    } else if (ticketProvider.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ticketProvider.errorMessage!),
          backgroundColor: Colors.red.shade700,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final lease = context.watch<LeaseProvider>().activeLease;
    final ticketProvider = context.watch<TicketProvider>();

    return Scaffold(
      backgroundColor: _offWhite,
      appBar: AppBar(
        backgroundColor: _indigo,
        foregroundColor: Colors.white,
        title: const Text('Report Maintenance Issue', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Unit Information Header Card
              Card(
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _indigo.withAlpha(20),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.home_work_outlined, color: _indigo, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              lease != null && lease.propertyName.isNotEmpty
                                  ? lease.propertyName
                                  : 'Assigned Property',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              lease != null && lease.unitNumber.isNotEmpty
                                  ? 'Unit Number: ${lease.unitNumber}'
                                  : 'Active Lease Unit',
                              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Description Section
              const Text(
                'Issue Description',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _indigo),
              ),
              const SizedBox(height: 6),
              Text(
                'Please describe the problem in detail (e.g. leaking sink under kitchen cabinet).',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                minLines: 3,
                decoration: InputDecoration(
                  hintText: 'Provide details about what needs repair...',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.0),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.0),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.0),
                    borderSide: const BorderSide(color: _indigo, width: 2),
                  ),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter a description of the issue.';
                  }
                  if (val.trim().length < 5) {
                    return 'Please provide a more detailed description (at least 5 characters).';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),

              // Urgency Level Selector
              const Row(
                children: [
                  Text(
                    'Urgency Level',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _indigo),
                  ),
                  Text(' *', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: TicketUrgency.values.map((urgency) {
                  final isSelected = _selectedUrgency == urgency;
                  final borderHasError = _showUrgencyError && _selectedUrgency == null;

                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3.0),
                      child: InkWell(
                        onTap: () {
                          setState(() {
                            _selectedUrgency = urgency;
                            _showUrgencyError = false;
                          });
                        },
                        borderRadius: BorderRadius.circular(10),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: isSelected ? _indigo : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected
                                  ? _indigo
                                  : borderHasError
                                      ? Colors.red.shade400
                                      : Colors.grey.shade300,
                              width: isSelected || borderHasError ? 2 : 1,
                            ),
                          ),
                          child: Text(
                            urgency.displayName,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : Colors.grey.shade700,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              if (_showUrgencyError && _selectedUrgency == null) ...[
                const SizedBox(height: 6),
                const Row(
                  children: [
                    Icon(Icons.error_outline, size: 14, color: Colors.redAccent),
                    SizedBox(width: 4),
                    Text(
                      'Please select an urgency level.',
                      style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 24),

              // Photo Attachment Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Attach Photos',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _indigo),
                  ),
                  Text(
                    '${_selectedImages.length} attached',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              Row(
                children: [
                  OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt_outlined, color: _indigo),
                    label: const Text('Camera', style: TextStyle(color: _indigo)),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                  const SizedBox(width: 10),
                  OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library_outlined, color: _indigo),
                    label: const Text('Gallery', style: TextStyle(color: _indigo)),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Image Thumbnail Previews
              if (_selectedImages.isNotEmpty)
                SizedBox(
                  height: 90,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _selectedImages.length,
                    itemBuilder: (context, index) {
                      final image = _selectedImages[index];
                      return Stack(
                        children: [
                          Container(
                            margin: const EdgeInsets.only(right: 12, top: 6),
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: kIsWeb
                                  ? Image.network(image.path, fit: BoxFit.cover)
                                  : Image.file(File(image.path), fit: BoxFit.cover),
                            ),
                          ),
                          Positioned(
                            top: 0,
                            right: 6,
                            child: GestureDetector(
                              onTap: () => _removeImage(index),
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close, size: 14, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              const SizedBox(height: 32),

              // Submit Button
              ElevatedButton(
                onPressed: ticketProvider.isSubmitting ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _indigo,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: ticketProvider.isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : const Text(
                        'Submit Maintenance Request',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
