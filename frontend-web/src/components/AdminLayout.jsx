import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Building2, LayoutDashboard, User, LogOut, Shield } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'User Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-[#F3F4F6]">
      {/* Persistent Dark Deep Indigo Left Sidebar */}
      <aside className="w-64 bg-[#1E3A8A] text-white flex flex-col justify-between shrink-0 shadow-lg">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-blue-900/50 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white m-0 leading-tight">SmartSpace</h2>
              <span className="text-xs text-blue-200">Management Shell</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
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
        <div className="p-4 border-t border-blue-900/50 bg-blue-950/40">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{user?.fullName || 'User'}</div>
              <div className="flex items-center gap-1 text-xs text-blue-200">
                <Shield className="w-3 h-3 text-[#10B981]" />
                <span className="truncate">{user?.role || 'Guest'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-red-600/80 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Light Gray Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto bg-[#F3F4F6]">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
