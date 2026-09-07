import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';

const CATEGORIES = [
  { value: 0, label: 'Plumbing' },
  { value: 1, label: 'Electrical' },
  { value: 2, label: 'HVAC' },
  { value: 3, label: 'General' },
];

export default function ItemModal({ isOpen, item, suppliers = [], onClose, onSuccess }) {
  const isEdit = Boolean(item && item.id);

  // Form State
  const [formData, setFormData] = useState({
    itemName: '',
    category: 0,
    supplierId: '',
    stockQuantity: 0,
    unitCost: 0.0,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Prefill form if editing
  useEffect(() => {
    if (item) {
      // Map category string back to integer if passed as string
      let catVal = item.category;
      if (typeof catVal === 'string') {
        const found = CATEGORIES.find((c) => c.label.toLowerCase() === catVal.toLowerCase());
        catVal = found ? found.value : 0;
      }

      setFormData({
        itemName: item.itemName || '',
        category: catVal ?? 0,
        supplierId: item.supplierId || (suppliers[0]?.id || ''),
        stockQuantity: item.stockQuantity ?? 0,
        unitCost: item.unitCost ?? 0.0,
      });
    } else {
      setFormData({
        itemName: '',
        category: 0,
        supplierId: suppliers[0]?.id || '',
        stockQuantity: 0,
        unitCost: 0.0,
      });
    }
    setErrors({});
    setServerError(null);
  }, [item, suppliers]);

  if (!isOpen) return null;

  // Client-Side Validation
  const validate = () => {
    const errs = {};

    if (!formData.itemName.trim()) {
      errs.itemName = 'Item name is required.';
    }

    if (!formData.supplierId) {
      errs.supplierId = 'Please select a supplier.';
    }

    if (formData.stockQuantity === '' || Number(formData.stockQuantity) < 0) {
      errs.stockQuantity = 'Stock quantity cannot be negative.';
    } else if (!Number.isInteger(Number(formData.stockQuantity))) {
      errs.stockQuantity = 'Stock quantity must be a whole number.';
    }

    if (formData.unitCost === '' || Number(formData.unitCost) < 0) {
      errs.unitCost = 'Unit cost (Rs.) cannot be negative.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error on typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      itemName: formData.itemName.trim(),
      category: Number(formData.category),
      supplierId: formData.supplierId,
      stockQuantity: Number(formData.stockQuantity),
      unitCost: parseFloat(formData.unitCost),
    };

    try {
      let result;
      if (isEdit) {
        result = await inventoryService.updateItem(item.id, payload);
      } else {
        result = await inventoryService.createItem(payload);
      }
      onSuccess(result, isEdit);
    } catch (err) {
      setServerError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Edit Spare Part' : 'Add New Spare Part'}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit ? 'Update details for this inventory item' : 'Enter part specifications to register in inventory'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Item Name *
            </label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              placeholder="e.g. Copper Pipe Joint 1/2 inch"
              className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                errors.itemName ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-[#1E3A8A]'
              } focus:outline-none transition-colors`}
            />
            {errors.itemName && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.itemName}</p>
            )}
          </div>

          {/* Category Dropdown & Supplier Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#1E3A8A] focus:outline-none bg-white cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Supplier *
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.supplierId ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-[#1E3A8A]'
                } focus:outline-none bg-white cursor-pointer`}
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.supplierId}</p>
              )}
            </div>
          </div>

          {/* Stock Quantity & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stock Quantity */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stockQuantity"
                min="0"
                step="1"
                value={formData.stockQuantity}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.stockQuantity ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-[#1E3A8A]'
                } focus:outline-none transition-colors`}
              />
              {errors.stockQuantity && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.stockQuantity}</p>
              )}
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Unit Cost (Rs.) *
              </label>
              <input
                type="number"
                name="unitCost"
                min="0"
                step="0.01"
                placeholder="e.g. 1500.00"
                value={formData.unitCost}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.unitCost ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-[#1E3A8A]'
                } focus:outline-none transition-colors`}
              />
              {errors.unitCost && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.unitCost}</p>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-[#F3F4F6] hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl shadow-sm transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <span>{isEdit ? 'Save Changes' : 'Create Part'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
