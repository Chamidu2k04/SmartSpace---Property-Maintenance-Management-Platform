import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Layers, Trash2, AlertTriangle } from 'lucide-react';
import { sendInventoryChatMessage } from '../../services/inventoryAssistantService';

export default function InventoryAiChatModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your Inventory & Supplier AI Assistant.\n\nYou can ask me questions about stock levels, low-stock alerts, and suppliers, or ask me to add, update, or remove items and suppliers!',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Helper to ensure text never displays raw markdown asterisks
  const formatCleanText = (text) => {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*\*/g, '');
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    'How many suppliers do we have?',
    'Show low stock items',
    'How many bulb holders in stock?',
    'Update stock of L Bend PVC to 65',
    'Add a new supplier',
  ];

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setError(null);
    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendInventoryChatMessage({
        messages: newMessages,
        pendingAction,
      });

      const nextPending = response.pending_action || null;
      setPendingAction(nextPending);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: formatCleanText(response.reply),
        },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to communicate with inventory AI assistant.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ ' + (err.message || 'I could not connect to the inventory service. Please ensure the AI service is running.'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || isLoading) return;
    await handleSend('confirm');
  };

  const handleCancelAction = async () => {
    if (!pendingAction || isLoading) return;
    await handleSend('cancel');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[620px] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-5 py-4 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base leading-tight">Inventory AI Assistant</h3>
                <span className="bg-emerald-500/20 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30 font-medium">
                  Live
                </span>
              </div>
              <p className="text-xs text-blue-100/80">Real-time stock & supplier agent</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1E3A8A] text-white rounded-tr-none shadow-sm'
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-200/80 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line">{formatCleanText(msg.content)}</div>
              </div>
            </div>
          ))}

          {/* Dynamic Confirmation Banner for Pending Action */}
          {pendingAction && (() => {
            const isDelete = pendingAction.action_type.startsWith('delete_');
            const isUpdate = pendingAction.action_type.startsWith('update_');
            const isSupplier = pendingAction.action_type.includes('supplier');

            const bannerStyle = isDelete
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : isUpdate
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-amber-50 border-amber-200 text-amber-900';

            const headerIcon = isDelete ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : isUpdate ? (
              <RefreshCw className="w-4 h-4 text-blue-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            );

            const headerTitle = isDelete
              ? 'Destructive Action Confirmation'
              : isUpdate
              ? 'Update Confirmation'
              : 'Confirmation Required';

            const actionDescription = isDelete
              ? `Ready to permanently delete this ${isSupplier ? 'supplier' : 'spare part'}. This action cannot be undone.`
              : isUpdate
              ? `Ready to update this ${isSupplier ? 'supplier' : 'spare part'}.`
              : `Ready to ${isSupplier ? 'register this supplier' : 'add this spare part to inventory'}.`;

            const confirmBtnStyle = isDelete
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : isUpdate
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white';

            const confirmBtnText = isDelete
              ? 'Confirm Delete'
              : isUpdate
              ? 'Confirm Update'
              : 'Confirm & Save';

            const ConfirmIcon = isDelete ? Trash2 : CheckCircle2;

            return (
              <div className={`border rounded-xl p-3 text-xs space-y-2 animate-in fade-in ${bannerStyle}`}>
                <div className="flex items-center gap-1.5 font-semibold">
                  {headerIcon}
                  <span>{headerTitle}</span>
                </div>
                <p className="text-gray-700">{actionDescription}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleConfirmAction}
                    disabled={isLoading}
                    className={`flex-1 font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 text-xs transition cursor-pointer shadow-sm disabled:opacity-50 ${confirmBtnStyle}`}
                  >
                    <ConfirmIcon className="w-3.5 h-3.5" />
                    <span>{confirmBtnText}</span>
                  </button>
                  <button
                    onClick={handleCancelAction}
                    disabled={isLoading}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1.5 px-3 rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2 shadow-sm">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1E3A8A]" />
              <span>Analyzing inventory...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      {messages.length <= 2 && (
        <div className="px-3 py-2 bg-gray-100/80 border-t border-gray-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-gray-400 font-medium text-[11px] whitespace-nowrap pl-1">Suggestions:</span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="bg-white border border-gray-200 hover:border-[#1E3A8A] hover:text-[#1E3A8A] text-gray-600 rounded-full px-2.5 py-1 whitespace-nowrap transition text-[11px] cursor-pointer shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask stock, suppliers, or 'add item'..."
          disabled={isLoading}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-[#1E3A8A] hover:bg-blue-900 disabled:opacity-40 text-white p-2.5 rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  </div>
  );
}
