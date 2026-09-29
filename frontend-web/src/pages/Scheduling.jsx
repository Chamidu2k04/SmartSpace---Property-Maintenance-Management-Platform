import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import TechnicianManagement from '../components/scheduling/TechnicianManagement';
import AppointmentCalendar from '../components/scheduling/AppointmentCalendar';
import QuotationDashboard from '../components/scheduling/QuotationDashboard';
import { Wrench, Calendar, FileText, CalendarClock } from 'lucide-react';

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
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <CalendarClock className="w-3.5 h-3.5" /> Operations Dispatch
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight m-0">Scheduling & Dispatch</h1>
          <p className="text-slate-500 text-sm mt-1">Coordinate technician dispatch, manage appointments calendar, and review maintenance quotations</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex flex-wrap gap-1.5 border border-slate-200/60 max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('technicians')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'technicians'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Technicians Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Appointments & Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('quotations')}
          className={`flex items-center gap-2 py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'quotations'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
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
