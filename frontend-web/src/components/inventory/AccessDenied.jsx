import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function AccessDenied({ currentRole }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = currentRole || user?.role || 'Guest';

  return (
    <div className="max-w-xl mx-auto my-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        {/* Lock / Alert Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Header */}
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Access Restricted
        </h2>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          You do not have permission to view or manage the <strong className="text-gray-900">Inventory & Supplier Management</strong> module.
        </p>

        {/* Role Comparison Card */}
        <div className="bg-[#F3F4F6] rounded-xl p-4 my-6 text-left border border-gray-200/70">
          <div className="flex items-center justify-between text-xs py-1 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Logged in as:</span>
            <span className="font-semibold text-gray-800 truncate max-w-[200px]">
              {user?.fullName || user?.email || 'Authenticated User'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Your Current Role:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-200 text-gray-700">
              {userRole}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1.5">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              Required Role:
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-100">
              InventoryOfficer
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          If you believe this is an error, please contact your system administrator to update your account privileges.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-sm font-medium rounded-xl shadow-sm transition-all focus:outline-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
