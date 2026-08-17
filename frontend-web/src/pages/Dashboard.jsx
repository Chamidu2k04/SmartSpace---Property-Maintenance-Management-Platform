import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { UserCheck, Shield, KeyRound } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              SmartSpace Security & User Management Module
            </p>
          </div>
          <span className="px-3.5 py-1.5 bg-[#10B981]/10 text-[#10B981] rounded-full font-semibold text-xs border border-[#10B981]/20">
            {user?.role} Account Active
          </span>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="w-10 h-10 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg flex items-center justify-center mb-4">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">User Identity</h3>
          <p className="text-lg font-bold text-gray-900 mt-1">{user?.email}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="w-10 h-10 bg-[#10B981]/10 text-[#10B981] rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Access Scope</h3>
          <p className="text-lg font-bold text-gray-900 mt-1">{user?.role} Permissions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="w-10 h-10 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg flex items-center justify-center mb-4">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Auth Token</h3>
          <p className="text-sm font-semibold text-gray-700 mt-1 truncate">JWT Signed & Encrypted</p>
        </div>
      </div>

      {/* Shared Module Notice */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Shared Authentication System</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          This base web shell manages session persistence and role access. Modules for Leases, Properties, Maintenance, Inventory, and Scheduling plug directly into this core identity layer.
        </p>
      </div>
    </div>
  );
}
