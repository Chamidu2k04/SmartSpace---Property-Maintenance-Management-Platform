import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import InventoryDashboard from '../components/inventory/InventoryDashboard';
import SuppliersList from '../components/inventory/SuppliersList';
import AccessDenied from '../components/inventory/AccessDenied';
import InventoryAiChatButton from '../components/inventory/InventoryAiChatButton';
import { Package, Truck, Boxes } from 'lucide-react';

export default function Inventory() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'suppliers'

  // If the user's role is not InventoryOfficer or InventoryManager, render Access Denied
  if (user?.role && user.role !== 'InventoryOfficer' && user.role !== 'InventoryManager') {
    return <AccessDenied currentRole={user.role} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <Boxes className="w-3.5 h-3.5" /> Warehouse & Logistics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight m-0">Inventory & Stock Control</h1>
          <p className="text-slate-500 text-sm mt-1">Manage spare parts inventory, monitor low stock thresholds, and coordinate suppliers</p>
        </div>
      </header>

      {/* Module Navigation Tabs */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex flex-wrap gap-1.5 border border-slate-200/60 max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Spare Parts Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'suppliers'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Supplier Directory</span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'inventory' ? <InventoryDashboard /> : <SuppliersList />}
      </div>

      {/* Standalone AI Inventory Assistant Floating Action Button */}
      <InventoryAiChatButton />
    </div>
  );
}
