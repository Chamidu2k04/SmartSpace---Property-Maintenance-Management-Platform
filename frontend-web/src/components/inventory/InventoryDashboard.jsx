import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Search, 
  Package, 
  Boxes, 
  DollarSign, 
  RefreshCw 
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import ItemModal from './ItemModal';
import AccessDenied from './AccessDenied';

const CATEGORY_NAMES = {
  0: 'Plumbing',
  1: 'Electrical',
  2: 'HVAC',
  3: 'General',
  Plumbing: 'Plumbing',
  Electrical: 'Electrical',
  HVAC: 'HVAC',
  General: 'General',
};

export default function InventoryDashboard() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Load Inventory & Suppliers
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAccessDenied(false);
      const [itemsData, suppliersData] = await Promise.all([
        inventoryService.getItems(),
        inventoryService.getSuppliers().catch(() => []),
      ]);
      setItems(itemsData || []);
      setSuppliers(suppliersData || []);
    } catch (err) {
      if (err.status === 403 || err.message?.includes('403') || err.message?.includes('Access Denied')) {
        setIsAccessDenied(true);
      }
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Delete
  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.itemName}"?`)) return;

    try {
      await inventoryService.deleteItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    }
  };

  // Open modal in Edit mode
  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Open modal in Add mode
  const handleAddNew = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  // Callback on successful save
  const handleItemSaved = (savedItem, isEdit) => {
    if (isEdit) {
      setItems((prev) => prev.map((i) => (i.id === savedItem.id ? savedItem : i)));
    } else {
      setItems((prev) => [savedItem, ...prev]);
    }
    setIsModalOpen(false);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        (item.itemName && item.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const itemCategoryStr = String(CATEGORY_NAMES[item.category] || item.category);
      const matchesCategory = categoryFilter === 'ALL' || itemCategoryStr === categoryFilter;
      const matchesLowStock = !onlyLowStock || item.stockQuantity < 5;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [items, searchTerm, categoryFilter, onlyLowStock]);

  const lowStockCount = useMemo(() => items.filter((i) => i.stockQuantity < 5).length, [items]);
  const totalValuation = useMemo(() => 
    items.reduce((acc, curr) => acc + (curr.stockQuantity || 0) * (curr.unitCost || 0), 0), 
    [items]
  );

  if (isAccessDenied) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Primary Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Spare Parts Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor stock levels, unit costs, and track low-stock inventory replenishment.
          </p>
        </div>

        {/* Deep Indigo Primary Action Button */}
        <button
          onClick={handleAddNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-medium text-sm rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:ring-offset-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Part</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Parts</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{items.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Low Stock Alert</span>
            <div className="text-2xl font-bold text-red-600 mt-1">{lowStockCount} items</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Stock Value</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">Rs. {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center font-bold text-sm">
            Rs.
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search part name or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#F3F4F6] border border-transparent rounded-lg focus:bg-white focus:border-[#1E3A8A] focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-[#F3F4F6] border border-transparent rounded-lg text-gray-700 focus:bg-white focus:border-[#1E3A8A] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="HVAC">HVAC</option>
            <option value="General">General</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyLowStock((prev) => !prev)}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              onlyLowStock 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Low Stock (&lt; 5)</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 text-gray-500 hover:text-gray-800 bg-[#F3F4F6] hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading catalog items...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 px-4 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-base font-medium text-gray-600">No spare parts found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or add a new part.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Item Name</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Supplier</th>
                  <th className="py-3.5 px-6 text-center">Stock Quantity</th>
                  <th className="py-3.5 px-6 text-right">Unit Cost (Rs.)</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredItems.map((item) => {
                  const isLowStock = item.stockQuantity < 5;
                  const categoryName = CATEGORY_NAMES[item.category] || item.category;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isLowStock 
                          ? 'bg-red-50/60 border-l-4 border-l-red-500 hover:bg-red-50/90' 
                          : 'hover:bg-gray-50/70 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Item Name */}
                      <td className="py-4 px-6 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {isLowStock && (
                            <span title="Low stock threshold breached (<5)">
                              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                            </span>
                          )}
                          <span>{item.itemName}</span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#1E3A8A] border border-blue-100">
                          {categoryName}
                        </span>
                      </td>

                      {/* Supplier Name */}
                      <td className="py-4 px-6 text-gray-600">
                        {item.supplierName || '—'}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            isLowStock
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-[#10B981] border border-emerald-100'
                          }`}
                        >
                          {item.stockQuantity} units
                        </span>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        Rs. {Number(item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            title="Edit Part"
                            className="p-1.5 text-gray-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            title="Delete Part"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <ItemModal
          isOpen={isModalOpen}
          item={selectedItem}
          suppliers={suppliers}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleItemSaved}
        />
      )}
    </div>
  );
}
