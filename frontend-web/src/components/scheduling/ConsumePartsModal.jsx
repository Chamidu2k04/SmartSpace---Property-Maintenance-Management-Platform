import React, { useState, useEffect } from 'react';
import { X, Package, Search, CheckCircle2, Minus, Plus, Loader2 } from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';

export default function ConsumePartsModal({ isOpen, onClose, appointment, onConfirmComplete }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParts, setSelectedParts] = useState({}); // { [itemId]: quantity }
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInventory();
      setSelectedParts({});
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load inventory parts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const categoryStr = typeof item.category === 'string' ? item.category : '';
    return (
      item.itemName?.toLowerCase().includes(q) ||
      categoryStr.toLowerCase().includes(q)
    );
  });

  const totalSelectedCount = Object.values(selectedParts).reduce((a, b) => a + b, 0);

  const handleQtyChange = (itemId, delta, maxStock) => {
    setSelectedParts((prev) => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: Math.min(next, maxStock) };
    });
  };

  const handleConfirmConsume = async () => {
    setIsSubmitting(true);
    try {
      // Deduct stock for each selected part
      for (const [itemId, qtyUsed] of Object.entries(selectedParts)) {
        if (qtyUsed > 0) {
          const item = items.find((i) => i.id === itemId);
          if (item) {
            const newStock = Math.max(0, item.stockQuantity - qtyUsed);
            await inventoryService.updateItem(item.id, {
              supplierId: item.supplierId,
              itemName: item.itemName,
              category: item.category,
              stockQuantity: newStock,
              unitCost: item.unitCost,
            });
          }
        }
      }
      await onConfirmComplete(appointment, true);
    } catch (err) {
      console.error('Failed to update inventory stock:', err);
      // Even if inventory update fails, complete job
      await onConfirmComplete(appointment, false);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleSkip = async () => {
    await onConfirmComplete(appointment, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-[#1E3A8A] rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Consume Parts for Job</h2>
              <p className="text-xs text-gray-500">
                Select parts used for Unit {appointment?.unitNumber || ''}. Deducts stock upon marking completed.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Row */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search part by name..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>

          {totalSelectedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{totalSelectedCount} item(s) selected to consume</span>
            </div>
          )}
        </div>

        {/* Parts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-gray-100">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
              <span className="text-xs">Loading parts catalog...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              No matching spare parts found.
            </div>
          ) : (
            filteredItems.map((item) => {
              const qty = selectedParts[item.id] || 0;
              const inStock = item.stockQuantity ?? 0;
              const categoryName =
                typeof item.category === 'string'
                  ? item.category
                  : typeof item.category === 'number'
                  ? ['Plumbing', 'Electrical', 'HVAC', 'General'][item.category] || 'General'
                  : 'General';

              return (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">
                      {item.itemName}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 rounded-md">
                        {categoryName}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          inStock > 0 ? 'text-gray-500' : 'text-red-500 font-semibold'
                        }`}
                      >
                        In Stock: {inStock}
                      </span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, -1, inStock)}
                      disabled={qty <= 0}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm text-gray-800">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, 1, inStock)}
                      disabled={qty >= inStock}
                      className="p-1 text-gray-500 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
          >
            Skip & Complete
          </button>
          <button
            onClick={handleConfirmConsume}
            disabled={totalSelectedCount === 0 || isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Confirm & Consume</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
