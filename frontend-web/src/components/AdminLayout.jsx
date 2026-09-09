import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Building2, LayoutDashboard, User, LogOut, Shield, Wrench, Package, Calendar, Users } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isInventoryManager = user?.role === 'InventoryOfficer' || user?.role === 'InventoryManager';

  let navItems = [];
  if (user?.role === 'Admin') {
    // Admin sees Dashboard, User Management, and User Profile
    navItems = [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'User Management', path: '/admin/users', icon: Users },
      { label: 'User Profile', path: '/profile', icon: User },
    ];
  } else if (isInventoryManager) {
    navItems = [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Inventory & Suppliers', path: '/inventory', icon: Package },
      { label: 'User Profile', path: '/profile', icon: User },
    ];
  } else {
    // PropertyManager, Technician, and regular roles
    navItems = [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ...(user?.role === 'PropertyManager'
        ? [{ label: 'Properties & Leases', path: '/properties', icon: Building2 }]
        : []),
      { label: 'Maintenance', path: '/maintenance', icon: Wrench },
      {
        label: user?.role === 'Technician' ? 'My Assigned Jobs' : 'Scheduling & Quotation',
        path: '/scheduling',
        icon: Calendar,
      },
      {
        label: 'User Profile',
        path: user?.role === 'Technician' ? '/technician-profile' : '/profile',
        icon: User,
      },
    ];
  }

  return (
    <div className="h-screen w-screen flex bg-[#F3F4F6] overflow-hidden">
      {/* Persistent Dark Deep Indigo Left Sidebar */}
      <aside className="w-64 h-full bg-[#1E3A8A] text-white flex flex-col justify-between shrink-0 shadow-xl z-20">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="p-6 border-b border-blue-900/50 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white m-0 leading-tight">SmartSpace</h2>
              <span className="text-xs text-blue-200">Management Shell</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/15 text-white shadow-inner font-semibold'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 text-blue-200" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Button */}
        <div className="p-4 border-t border-blue-900/50 bg-blue-950/40 shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'A')}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate" title={user?.fullName || user?.email || 'Administrator'}>
                {user?.fullName || user?.email || 'Administrator'}
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-200">
                <Shield className="w-3 h-3 text-[#10B981]" />
                <span className="truncate">{user?.role || 'Admin'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-red-600/90 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full p-8 overflow-y-auto bg-[#F3F4F6]">
        <div className="max-w-6xl mx-auto pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}