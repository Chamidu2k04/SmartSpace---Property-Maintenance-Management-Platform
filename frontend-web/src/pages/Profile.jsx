import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Shield, IdCard } from 'lucide-react';

export default function Profile() {
  const { user, fetchProfile } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <Shield className="w-3.5 h-3.5" /> Identity & Verification
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight m-0">My Security Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Protected account profile parameters verified via cryptographically signed JWT Bearer Token</p>
      </header>

      <div className="bg-white rounded-3xl shadow-xs p-6 sm:p-8 border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 m-0">{user?.fullName}</h2>
            <span className="inline-flex items-center gap-1 mt-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold text-xs rounded-full">
              <Shield className="w-3 h-3 text-emerald-600" />
              {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-center gap-3.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 text-slate-500 shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 text-slate-500 shadow-xs">
              <IdCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">User ID (UUID)</div>
              <div className="text-sm font-mono font-medium text-slate-700 mt-0.5">{user?.id}</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 text-slate-500 shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Role</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
