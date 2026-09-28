import React, { useState } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import InventoryAiChatModal from './InventoryAiChatModal';

export default function InventoryAiChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Round Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        {/* Tooltip on hover */}
        {!isOpen && (
          <div className="hidden sm:block bg-gray-900/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-xs font-medium pointer-events-none transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 animate-in fade-in">
            Inventory AI
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#1E3A8A] to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer border-2 border-white/20 focus:outline-none focus:ring-4 focus:ring-blue-300"
          title="Open Inventory AI Assistant"
          aria-label="Toggle Inventory AI Assistant"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white transition-transform duration-200 rotate-0" />
          ) : (
            <>
              <Bot className="w-7 h-7 text-white" />
              {/* Sparkle badge */}
              <span className="absolute -top-1 -right-1 bg-amber-400 text-gray-900 rounded-full p-1 shadow-md animate-bounce">
                <Sparkles className="w-3 h-3 text-amber-900" />
              </span>
            </>
          )}
        </button>
      </div>

      {/* Floating Chat Modal */}
      <InventoryAiChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
