import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

/// Standalone QR Scanner Screen for Inventory Officers.
/// Isolated from technician job completion workflows.
class StandaloneQrScannerScreen extends StatefulWidget {
  const StandaloneQrScannerScreen({super.key});

  @override
  State<StandaloneQrScannerScreen> createState() => _StandaloneQrScannerScreenState();
}

class _StandaloneQrScannerScreenState extends State<StandaloneQrScannerScreen>
    with SingleTickerProviderStateMixin {
  static const Color _primaryNavy = Color(0xFF1E3A8A);

  late AnimationController _animController;
  late Animation<double> _animation;

  final TextEditingController _idInputController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  bool _isProcessing = false;

  static final RegExp _uuidRegex = RegExp(
    r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
  );

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);

    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    _idInputController.dispose();
    super.dispose();
  }

  // Handle Image File Upload (Gallery / Photo)
  Future<void> _pickImageAndDecode(ImageSource source) async {
    try {
      setState(() => _isProcessing = true);
      final XFile? file = await _picker.pickImage(source: source);
      if (file == null) {
        setState(() => _isProcessing = false);
        return;
      }

      // Check if file name contains a UUID payload
      final match = _uuidRegex.firstMatch(file.name) ?? _uuidRegex.firstMatch(file.path);
      if (match != null) {
        _completeScan(match.group(0)!);
        return;
      }

      // If cannot parse directly from file path, show confirmation dialog
      if (mounted) {
        setState(() => _isProcessing = false);
        _showImageConfirmDialog(file.name);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error reading image: $e'), backgroundColor: Colors.red.shade700),
        );
      }
    }
  }

  void _showImageConfirmDialog(String fileName) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.image_outlined, color: _primaryNavy),
            SizedBox(width: 8),
            Text('QR Image Selected', style: TextStyle(fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Selected file: $fileName',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            const Text(
              'Confirm or enter the Part UUID encoded in this QR image:',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _idInputController,
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
              final text = _idInputController.text.trim();
              Navigator.of(dialogCtx).pop();
              if (text.isNotEmpty) {
                _completeScan(text);
              }
            },
            child: const Text('Lookup Part'),
          ),
        ],
      ),
    );
  }

  // Paste UUID directly from device clipboard
  Future<void> _pasteFromClipboard() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    final text = data?.text?.trim() ?? '';
    if (text.isNotEmpty) {
      _idInputController.text = text;
      _completeScan(text);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Clipboard is empty')),
        );
      }
    }
  }

  void _completeScan(String payload) {
    Navigator.of(context).pop(payload.trim());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Part QR Scanner',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.paste_rounded),
            tooltip: 'Paste ID from Clipboard',
            onPressed: _pasteFromClipboard,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Instructions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Text(
                'Center the spare part QR code inside the viewfinder, or choose an image file from your device.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
              ),
            ),

            // Viewfinder Area with Scanning Animation
            Expanded(
              child: Center(
                child: Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white24, width: 2),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Stack(
                      children: [
                        // Viewfinder background
                        Container(color: Colors.white.withValues(alpha: 0.04)),

                        // Corner accent marks
                        ..._buildCornerBorders(),

                        // Animated scanning beam
                        AnimatedBuilder(
                          animation: _animation,
                          builder: (context, child) {
                            return Positioned(
                              top: _animation.value * 240,
                              left: 10,
                              right: 10,
                              child: Container(
                                height: 3,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Colors.transparent,
                                      Color(0xFF3B82F6),
                                      Colors.cyanAccent,
                                      Color(0xFF3B82F6),
                                      Colors.transparent,
                                    ],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.cyanAccent.withValues(alpha: 0.6),
                                      blurRadius: 8,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),

                        // Center Icon
                        Center(
                          child: Icon(
                            Icons.qr_code_scanner_rounded,
                            size: 48,
                            color: Colors.white.withValues(alpha: 0.2),
                          ),
                        ),

                        // Loading overlay
                        if (_isProcessing)
                          Container(
                            color: Colors.black54,
                            child: const Center(
                              child: CircularProgressIndicator(color: Colors.white),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Bottom Actions Card
            Container(
              padding: const EdgeInsets.all(20.0),
              decoration: const BoxDecoration(
                color: Color(0xFF1E293B),
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Action buttons: Gallery Upload & Camera Capture
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white30),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () => _pickImageAndDecode(ImageSource.gallery),
                          icon: const Icon(Icons.photo_library_outlined, size: 18),
                          label: const Text('Upload QR', style: TextStyle(fontSize: 13)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _primaryNavy,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () => _pickImageAndDecode(ImageSource.camera),
                          icon: const Icon(Icons.camera_alt_outlined, size: 18),
                          label: const Text('Take Photo', style: TextStyle(fontSize: 13)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Manual UUID Entry Field
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _idInputController,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Or enter Part ID / UUID...',
                            hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                            filled: true,
                            fillColor: const Color(0xFF0F172A),
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        style: IconButton.styleFrom(
                          backgroundColor: const Color(0xFF3B82F6),
                        ),
                        icon: const Icon(Icons.arrow_forward_rounded, size: 18, color: Colors.white),
                        onPressed: () {
                          final val = _idInputController.text.trim();
                          if (val.isNotEmpty) {
                            _completeScan(val);
                          }
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildCornerBorders() {
    const double size = 24.0;
    const double thickness = 3.5;
    const Color color = Colors.cyanAccent;

    return [
      // Top Left
      Positioned(
        top: 0,
        left: 0,
        child: Container(
          width: size,
          height: thickness,
          color: color,
        ),
      ),
      Positioned(
        top: 0,
        left: 0,
        child: Container(
          width: thickness,
          height: size,
          color: color,
        ),
      ),
      // Top Right
      Positioned(
        top: 0,
        right: 0,
        child: Container(
          width: size,
          height: thickness,
          color: color,
        ),
      ),
      Positioned(
        top: 0,
        right: 0,
        child: Container(
          width: thickness,
          height: size,
          color: color,
        ),
      ),
      // Bottom Left
      Positioned(
        bottom: 0,
        left: 0,
        child: Container(
          width: size,
          height: thickness,
          color: color,
        ),
      ),
      Positioned(
        bottom: 0,
        left: 0,
        child: Container(
          width: thickness,
          height: size,
          color: color,
        ),
      ),
      // Bottom Right
      Positioned(
        bottom: 0,
        right: 0,
        child: Container(
          width: size,
          height: thickness,
          color: color,
        ),
      ),
      Positioned(
        bottom: 0,
        right: 0,
        child: Container(
          width: thickness,
          height: size,
          color: color,
        ),
      ),
    ];
  }
}
