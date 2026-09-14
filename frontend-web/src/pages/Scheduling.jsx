import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import TechnicianManagement from '../components/scheduling/TechnicianManagement';
import AppointmentCalendar from '../components/scheduling/AppointmentCalendar';
import QuotationDashboard from '../components/scheduling/QuotationDashboard';
import { Wrench, Calendar, FileText } from 'lucide-react';

export default function Scheduling() {
  const { user } = useAuthStore();
  const isTechnician = user?.role === 'Technician';
  const isRestrictedUser = user?.role === 'Tenant' || user?.role === 'InventoryOfficer';
  const [activeTab, setActiveTab] = useState('technicians'); // 'technicians' | 'appointments' | 'quotations'

  if (isRestrictedUser) {
    return <Navigate to="/dashboard" replace />;
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
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${activeTab === 'technicians'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Technicians Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${activeTab === 'appointments'
              ? 'border-[#1E3A8A] text-[#1E3A8A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments & Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('quotations')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${activeTab === 'quotations'
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
