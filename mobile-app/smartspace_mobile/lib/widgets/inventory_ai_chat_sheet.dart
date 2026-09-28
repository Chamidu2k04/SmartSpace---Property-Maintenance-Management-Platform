import 'package:flutter/material.dart';
import '../services/inventory_assistant_service.dart';

class InventoryAiChatSheet extends StatefulWidget {
  const InventoryAiChatSheet({super.key});

  @override
  State<InventoryAiChatSheet> createState() => _InventoryAiChatSheetState();
}

class _InventoryAiChatSheetState extends State<InventoryAiChatSheet> {
  final InventoryAssistantService _service = InventoryAssistantService();
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<Map<String, String>> _messages = [
    {
      'role': 'assistant',
      'content':
          'Hello! I am your Inventory & Supplier AI Assistant.\n\nAsk me about stock quantities, low-stock items, or ask me to add, update, or remove spare parts and suppliers!',
    },
  ];

  Map<String, dynamic>? _pendingAction;
  bool _isLoading = false;

  static const Color _primaryNavy = Color(0xFF1E3A8A);

  final List<String> _quickSuggestions = const [
    'How many suppliers do we have?',
    'Show low stock items',
    'How many bulb holders in stock?',
    'Update stock of L Bend PVC to 65',
    'Add a new supplier',
  ];

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || _isLoading) return;

    _textController.clear();
    setState(() {
      _messages.add({'role': 'user', 'content': trimmed});
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final response = await _service.sendMessage(
        messages: _messages,
        pendingAction: _pendingAction,
      );

      setState(() {
        _messages.add({
          'role': 'assistant',
          'content': response['reply']?.toString() ?? 'No response.',
        });
        _pendingAction = response['pending_action'] as Map<String, dynamic>?;
      });
    } catch (e) {
      final errorMsg = e.toString().replaceAll('Exception: ', '');
      setState(() {
        _messages.add({
          'role': 'assistant',
          'content': '⚠️ $errorMsg',
        });
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    // Take up ~85% of screen height
    final height = MediaQuery.of(context).size.height * 0.85;

    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: _primaryNavy,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(40),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.smart_toy, color: Colors.amber, size: 22),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Inventory AI Assistant',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        'Real-time stock & supplier intelligence',
                        style: TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Messages List
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg['role'] == 'user';

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.8,
                    ),
                    decoration: BoxDecoration(
                      color: isUser ? _primaryNavy : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(16).copyWith(
                        topRight: isUser ? Radius.zero : const Radius.circular(16),
                        topLeft: isUser ? const Radius.circular(16) : Radius.zero,
                      ),
                      border: isUser ? null : Border.all(color: Colors.grey.shade300),
                    ),
                    child: Text(
                      (msg['content'] ?? '').replaceAll('**', ''),
                      style: TextStyle(
                        color: isUser ? Colors.white : Colors.black87,
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Pending Action Confirmation Banner
          if (_pendingAction != null)
            Builder(
              builder: (context) {
                final actionType = (_pendingAction!['action_type'] as String? ?? '');
                final isDelete = actionType.startsWith('delete_');
                final isUpdate = actionType.startsWith('update_');
                final isSupplier = actionType.contains('supplier');

                final bgColor = isDelete
                    ? Colors.red.shade50
                    : isUpdate
                        ? Colors.blue.shade50
                        : Colors.amber.shade50;
                final borderColor = isDelete
                    ? Colors.red.shade300
                    : isUpdate
                        ? Colors.blue.shade300
                        : Colors.amber.shade300;
                final headerColor = isDelete
                    ? Colors.red.shade900
                    : isUpdate
                        ? Colors.blue.shade900
                        : Colors.amber.shade900;
                final headerIcon = isDelete
                    ? Icons.warning_amber_rounded
                    : isUpdate
                        ? Icons.update
                        : Icons.check_circle_outline;
                final headerTitle = isDelete
                    ? 'Destructive Action Confirmation'
                    : isUpdate
                        ? 'Update Confirmation'
                        : 'Confirmation Required';
                final description = isDelete
                    ? 'Ready to permanently delete this ${isSupplier ? 'supplier' : 'spare part'}. This cannot be undone.'
                    : isUpdate
                        ? 'Ready to update this ${isSupplier ? 'supplier' : 'spare part'}.'
                        : 'Ready to ${isSupplier ? 'register this supplier' : 'add this spare part'}.';
                final buttonBg = isDelete
                    ? Colors.red.shade700
                    : isUpdate
                        ? Colors.blue.shade700
                        : Colors.green.shade700;
                final buttonLabel = isDelete
                    ? 'Confirm Delete'
                    : isUpdate
                        ? 'Confirm Update'
                        : 'Confirm & Save';
                final buttonIcon = isDelete
                    ? Icons.delete_outline
                    : isUpdate
                        ? Icons.check
                        : Icons.check;

                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(headerIcon, color: headerColor, size: 18),
                          const SizedBox(width: 6),
                          Text(
                            headerTitle,
                            style: TextStyle(
                              color: headerColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        style: TextStyle(color: Colors.grey.shade800, fontSize: 12),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _isLoading ? null : () => _sendMessage('Confirm'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: buttonBg,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              icon: Icon(buttonIcon, size: 16),
                              label: Text(buttonLabel, style: const TextStyle(fontSize: 12)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton(
                            onPressed: _isLoading ? null : () => _sendMessage('Cancel'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Cancel', style: TextStyle(fontSize: 12)),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),

          // Quick Suggestion Chips
          if (_messages.length <= 2)
            SizedBox(
              height: 38,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _quickSuggestions.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (context, index) {
                  final text = _quickSuggestions[index];
                  return ActionChip(
                    label: Text(text, style: const TextStyle(fontSize: 11)),
                    backgroundColor: Colors.grey.shade50,
                    side: BorderSide(color: Colors.grey.shade300),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    onPressed: () => _sendMessage(text),
                  );
                },
              ),
            ),

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: _primaryNavy),
                  ),
                  SizedBox(width: 8),
                  Text('AI is analyzing inventory...', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
            ),

          // Input Form
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      decoration: InputDecoration(
                        hintText: "Ask stock, suppliers, or 'add item'...",
                        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        filled: true,
                        fillColor: Colors.grey.shade100,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: _sendMessage,
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: _primaryNavy,
                    radius: 20,
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white, size: 18),
                      onPressed: () => _sendMessage(_textController.text),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
