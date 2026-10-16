import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Building2, Wrench, Plus, User, LogOut, Shield, Menu, X, ChevronRight } from "lucide-react";

/**
 * TenantLayout — Shared sidebar layout for all /tenant/* routes.
 * Styled consistently with AdminLayout (same colors, spacing, structure).
 * Fully mobile-responsive with slide-out drawer and top navigation bar.
 */
export default function TenantLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: "My Maintenance", path: "/tenant/maintenance", icon: Wrench },
    { label: "Submit Request",  path: "/tenant/submit",      icon: Plus  },
    { label: "Profile",         path: "/profile",             icon: User  },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentNav = navItems.find((item) => item.path === location.pathname);

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <Link to="/tenant/maintenance" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-900/30 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white m-0 leading-tight">SmartSpace</h2>
              <span className="text-[11px] text-blue-300/80 font-medium">Tenant Portal</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3.5 space-y-1.5 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-300"}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-blue-200" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User + Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-3 mb-3.5 px-1.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "T"}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-white truncate" title={user?.fullName || user?.email || "Tenant"}>
              {user?.fullName || user?.email || "Tenant"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="truncate">Resident / Tenant</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-800/70 hover:bg-rose-600/90 text-slate-200 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer border border-slate-700/60 hover:border-rose-500 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row bg-[#f8fafc] overflow-hidden">
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0f172a] text-white border-b border-slate-800 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">SmartSpace</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentNav && (
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-medium hidden sm:inline-block">
              {currentNav.label}
            </span>
          )}
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "T"}
          </div>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-[#0f172a] text-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl flex flex-col ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-full bg-[#0f172a] text-white flex-col justify-between shrink-0 shadow-xl z-20 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto pb-12">{children}</div>
      </main>
    </div>
  );
}
