import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Shield, IdCard } from 'lucide-react';

export default function Profile() {
  const { user, fetchProfile } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">My Security Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Protected account profile parameters verified via JWT Bearer Token</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 max-w-2xl">
        <div className="flex items-center gap-5 pb-6 border-b border-gray-100 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#1E3A8A] text-white font-bold text-2xl flex items-center justify-center shadow-md">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 m-0">{user?.fullName}</h2>
            <span className="inline-block mt-1 px-3 py-1 bg-[#10B981]/10 text-[#10B981] font-semibold text-xs rounded-md">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</div>
              <div className="text-sm font-medium text-gray-900">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <IdCard className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID (UUID)</div>
              <div className="text-sm font-mono text-gray-800">{user?.id}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Role</div>
              <div className="text-sm font-medium text-gray-900">{user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
