import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  UserCheck,
  Users, 
  Building2, 
  Wrench, 
  Package, 
  Calendar, 
  ArrowRight,
  Sparkles,
  Activity,
  Shield,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Boxes,
  Truck
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();

  // Non-technical, operational summary highlights tailored to each user's real-world role
  const getRoleHighlights = (role) => {
    switch (role) {
      case 'PropertyManager':
        return [
          {
            title: 'Maintenance Stream',
            value: 'Repair Requests',
            description: 'Triage work orders and approve pending repairs',
            icon: Wrench,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            badge: 'Live',
          },
          {
            title: 'Property Portfolio',
            value: 'Units & Leases',
            description: 'Oversee residential units and lease occupancies',
            icon: Building2,
            color: 'text-[#1E3A8A]',
            bg: 'bg-blue-50',
            badge: 'Synchronized',
          },
          {
            title: 'Technician Network',
            value: 'Scheduling & Quotes',
            description: 'Assign maintenance jobs and review quotes',
            icon: Calendar,
            color: 'text-[#10B981]',
            bg: 'bg-emerald-50',
            badge: 'Connected',
          },
        ];
      case 'InventoryOfficer':
      case 'InventoryManager':
        return [
          {
            title: 'Parts Catalog',
            value: 'Spare Parts Inventory',
            description: 'Track equipment stock quantities & low alerts',
            icon: Package,
            color: 'text-[#1E3A8A]',
            bg: 'bg-blue-50',
            badge: 'Tracked',
          },
          {
            title: 'Barcode & QR System',
            value: 'Instant Hardware Lookup',
            description: 'Scan item QR codes via mobile or webcam',
            icon: QrCode,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            badge: 'Scanner Ready',
          },
          {
            title: 'Supply Chain',
            value: 'Verified Suppliers',
            description: 'Contact hardware vendors for restock orders',
            icon: Boxes,
            color: 'text-[#10B981]',
            bg: 'bg-emerald-50',
            badge: 'Active',
          },
        ];
      case 'Admin':
        return [
          {
            title: 'System Health',
            value: 'All Systems Normal',
            description: 'Real-time database and API services online',
            icon: Activity,
            color: 'text-[#10B981]',
            bg: 'bg-emerald-50',
            badge: 'Online',
          },
          {
            title: 'Access Governance',
            value: 'Role-Based Control',
            description: 'Multi-role user permission management',
            icon: Users,
            color: 'text-[#1E3A8A]',
            bg: 'bg-blue-50',
            badge: 'Protected',
          },
          {
            title: 'Data Protection',
            value: 'Enterprise Security',
            description: 'Tenant privacy and audit logs compliant',
            icon: ShieldCheck,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            badge: 'Secured',
          },
        ];
      default:
        return [
          {
            title: 'Residence Status',
            value: 'Active Tenancy',
            description: 'Assigned residential unit and lease active',
            icon: Building2,
            color: 'text-[#1E3A8A]',
            bg: 'bg-blue-50',
            badge: 'Active',
          },
          {
            title: 'Repair Support',
            value: 'Maintenance Helpdesk',
            description: 'Direct reporting for plumbing, electrical & HVAC',
            icon: Wrench,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            badge: 'Available',
          },
          {
            title: 'Service Dispatch',
            value: 'Priority Technicians',
            description: 'Repairs handled by certified technicians',
            icon: CheckCircle2,
            color: 'text-[#10B981]',
            bg: 'bg-emerald-50',
            badge: 'On-Call',
          },
        ];
    }
  };

  const highlights = getRoleHighlights(user?.role);

  return (
    <div className="space-y-6">
      {/* 1. Modern Welcome Banner */}
      <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#1E3A8A] rounded-full text-xs font-semibold mb-3 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-[#1E3A8A]" />
              SmartSpace Operational Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">
              Manage your properties, oversee maintenance workflows, and audit system activity with real-time sync.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-emerald-50 text-[#10B981] rounded-xl font-semibold text-xs border border-emerald-200 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              {user?.role} Active
            </span>
          </div>
        </div>
      </div>

      {/* 2. User-Centric Operational Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {item.title}
                </h3>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {item.value}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Role-Based Quick Action Navigation Cards */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Operations Hub</h2>

        {user?.role === 'Admin' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/users"
              className="p-5 rounded-xl border border-gray-200/80 hover:border-[#1E3A8A] hover:bg-blue-50/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1E3A8A] flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-[#1E3A8A]">User Management</h4>
                  <p className="text-xs text-gray-500">Manage user roles, grant permissions, and review accounts</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#1E3A8A] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/profile"
              className="p-5 rounded-xl border border-gray-200/80 hover:border-[#1E3A8A] hover:bg-blue-50/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-[#1E3A8A]">My Profile</h4>
                  <p className="text-xs text-gray-500">Review security credentials and personal information</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#1E3A8A] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {user?.role === 'PropertyManager' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/properties"
              className="p-5 rounded-xl border border-gray-200/80 hover:border-[#1E3A8A] hover:bg-blue-50/40 transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#1E3A8A] flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 group-hover:text-[#1E3A8A]">Properties & Leases</h4>
                <p className="text-xs text-gray-500 mt-1">Manage buildings, residential units, and active lease records</p>
              </div>
            </Link>

            <Link
              to="/maintenance"
              className="p-5 rounded-xl border border-gray-200/80 hover:border-[#1E3A8A] hover:bg-blue-50/40 transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 group-hover:text-[#1E3A8A]">Maintenance Approvals</h4>
                <p className="text-xs text-gray-500 mt-1">Triage tenant repair tickets and dispatch maintenance requests</p>
              </div>
            </Link>

            <Link
              to="/scheduling"
              className="p-5 rounded-xl border border-gray-200/80 hover:border-[#1E3A8A] hover:bg-blue-50/40 transition-all flex flex-col justify-between group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#10B981] flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 group-hover:text-[#1E3A8A]">Technician Scheduling</h4>
                <p className="text-xs text-gray-500 mt-1">Assign appointments, review repair quotes, and manage technicians</p>
              </div>
            </Link>
          </div>
        )}

        {(user?.role === 'InventoryOfficer' || user?.role === 'InventoryManager') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/inventory"
              className="p-5 rounded-xl border border-gray-200/80 hover:border-[#1E3A8A] hover:bg-blue-50/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1E3A8A] flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-[#1E3A8A]">Spare Parts Catalog</h4>
                  <p className="text-xs text-gray-500">Monitor stock levels, generate QR codes, and log restocks</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#1E3A8A] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/inventory"
              className="p-5 rounded-xl border border-gray-200/80 hover:border-[#1E3A8A] hover:bg-blue-50/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#10B981] flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-[#1E3A8A]">Supplier Directory</h4>
                  <p className="text-xs text-gray-500">Contact verified equipment and component suppliers</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#1E3A8A] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
