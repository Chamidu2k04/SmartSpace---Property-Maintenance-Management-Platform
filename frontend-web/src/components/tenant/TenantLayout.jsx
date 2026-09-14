import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Building2, Wrench, Plus, User, LogOut, Shield } from "lucide-react";

/**
 * TenantLayout — Shared sidebar layout for all /tenant/* routes.
 * Styled consistently with AdminLayout (same colors, spacing, structure).
 * Added by Member 2 — Maintenance Request Management.
 * DO NOT modify without team coordination.
 */
export default function TenantLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "My Maintenance", path: "/tenant/maintenance", icon: Wrench },
    { label: "Submit Request",  path: "/tenant/submit",      icon: Plus  },
    { label: "Profile",         path: "/profile",             icon: User  },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen w-screen flex bg-[#F3F4F6] overflow-hidden">
      {/* ── Persistent Dark Sidebar ── */}
      <aside className="w-64 h-full bg-[#1E3A8A] text-white flex flex-col justify-between shrink-0 shadow-xl z-20">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand */}
          <div className="p-6 border-b border-blue-900/50 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white m-0 leading-tight">SmartSpace</h2>
              <span className="text-xs text-blue-200">Tenant Portal</span>
            </div>
          </div>

          {/* Nav */}
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
                      ? "bg-white/15 text-white shadow-inner font-semibold"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 text-blue-200" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User + Logout */}
        <div className="p-4 border-t border-blue-900/50 bg-blue-950/40 shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "T"}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">
                {user?.fullName || user?.email || "Tenant"}
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-200">
                <Shield className="w-3 h-3 text-[#10B981]" />
                <span className="truncate">Tenant</span>
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

      {/* ── Main Content ── */}
      <main className="flex-1 h-full p-8 overflow-y-auto bg-[#F3F4F6]">
        <div className="max-w-5xl mx-auto pb-12">{children}</div>
      </main>
    </div>
  );
}
