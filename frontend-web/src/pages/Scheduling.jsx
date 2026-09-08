import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import TechnicianManagement from '../components/scheduling/TechnicianManagement';
import AppointmentCalendar from '../components/scheduling/AppointmentCalendar';
import QuotationDashboard from '../components/scheduling/QuotationDashboard';
import { Wrench, Calendar, FileText, ShieldAlert, Lock } from 'lucide-react';

export default function Scheduling() {
  const { user } = useAuthStore();
  const isTechnician = user?.role === 'Technician';
  const isRestrictedUser = user?.role === 'Tenant' || user?.role === 'InventoryOfficer';
  const [activeTab, setActiveTab] = useState('technicians'); // 'technicians' | 'appointments' | 'quotations'

  if (isRestrictedUser) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center space-y-4 max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Technician Profile Management, Appointment Management, and Quotation Approvals are restricted. Full management access is reserved for <span className="font-semibold text-gray-900">Property Managers</span>.
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
            <Lock className="w-3.5 h-3.5" />
            {user?.role || 'User'} Role Restricted
          </span>
        </div>
      </div>
    );
  }

  if (isTechnician) {
    return (
      <div className="space-y-6">
        <AppointmentCalendar isTechnicianView={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 pt-3 rounded-xl shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('technicians')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'technicians'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Technicians Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments & Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('quotations')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'quotations'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Quotations & Approvals</span>
        </button>
      </div>

      {/* Tab Content Rendering */}
      <div>
        {activeTab === 'technicians' && <TechnicianManagement />}
        {activeTab === 'appointments' && <AppointmentCalendar />}
        {activeTab === 'quotations' && <QuotationDashboard />}
      </div>
    </div>
  );
}
