import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import InventoryDashboard from '../components/inventory/InventoryDashboard';
import SuppliersList from '../components/inventory/SuppliersList';
import AccessDenied from '../components/inventory/AccessDenied';
import { Package, Truck } from 'lucide-react';

export default function Inventory() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'suppliers'

  // If the user's role is not InventoryOfficer, render the user-friendly Access Denied card
  if (user?.role && user.role !== 'InventoryOfficer') {
    return <AccessDenied currentRole={user.role} />;
  }

  return (
    <div className="space-y-6">
      {/* Module Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 pt-3 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Spare Parts Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'suppliers'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Supplier Directory</span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'inventory' ? <InventoryDashboard /> : <SuppliersList />}
      </div>
    </div>
  );
}
