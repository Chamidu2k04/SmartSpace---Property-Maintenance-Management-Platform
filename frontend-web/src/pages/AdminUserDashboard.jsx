import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/useAuthStore';
import { Search, Shield, UserCheck, AlertCircle, CheckCircle2, RefreshCw, Lock } from 'lucide-react';

const SYSTEM_ROLES = [
  'Admin',
  'Tenant',
  'PropertyManager',
  'InventoryOfficer',
];

export default function AdminUserDashboard() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [alert, setAlert] = useState({ type: null, message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: null, message: '' });
    }, 4500);
  };

  const loadUsers = useCallback(async (search = '') => {
    setIsLoading(true);
    try {
      const data = await userService.fetchUsers(search);
      setUsers(data);
    } catch (err) {
      showAlert('error', err.message || 'Failed to retrieve user accounts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(searchQuery);
  };

  const handleRoleChange = async (userId, newRole) => {
    if (newRole === 'Technician') {
      showAlert('error', 'Technician accounts are managed by Property Managers.');
      return;
    }
    setUpdatingUserId(userId);
    try {
      const updated = await userService.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
      showAlert('success', `User role successfully updated to ${newRole}.`);
    } catch (err) {
      showAlert('error', err.message || 'Failed to update user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <Shield className="w-3.5 h-3.5" /> Governance & Security
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight m-0">
            User Management & Access Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search registered tenants, managers, and staff, and reassign system permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadUsers(searchQuery)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Client-side Notification Alerts */}
      {alert.type && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium flex items-center justify-between shadow-xs transition-all ${
            alert.type === 'success'
              ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50/80 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert({ type: null, message: '' })}
            className="text-xs uppercase font-bold tracking-wider hover:opacity-75 px-2 py-1 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{users.length}</h3>
            <span className="text-[11px] text-slate-500 font-medium">Registered accounts</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Administrators</p>
            <h3 className="text-2xl font-bold text-purple-700 mt-1">
              {users.filter((u) => u.role === 'Admin').length}
            </h3>
            <span className="text-[11px] text-purple-600 font-medium">Full governance access</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Property Managers</p>
            <h3 className="text-2xl font-bold text-indigo-700 mt-1">
              {users.filter((u) => u.role === 'PropertyManager').length}
            </h3>
            <span className="text-[11px] text-indigo-600 font-medium">Operations & leases</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tenants & Officers</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">
              {users.filter((u) => u.role === 'Tenant' || u.role === 'InventoryOfficer').length}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium">Residents & stock</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Bar Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by full name or email (e.g. john@example.com)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadUsers('');
                }}
                className="absolute right-3.5 top-3 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'Searching...' : 'Search Users'}
          </button>
        </form>
      </div>

      {/* Users Data Table Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-100 tracking-wider">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="font-medium text-slate-600">Loading user records...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No users found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try searching with a different term.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentUser?.id || (currentUser?.email && user.email?.toLowerCase() === currentUser.email?.toLowerCase());

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100 shrink-0">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{user.fullName}</span>
                              {isSelf && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'Admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : user.role === 'Tenant'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : user.role === 'Technician'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : user.role === 'InventoryOfficer'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isSelf ? (
                          <span
                            title="You cannot modify your own administrator role"
                            className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium italic bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl cursor-not-allowed"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            Locked (Self)
                          </span>
                        ) : user.role === 'Technician' ? (
                          <span
                            title="Technician accounts are managed by Property Managers"
                            className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium italic bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl cursor-not-allowed"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            Managed by PM
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            disabled={updatingUserId === user.id}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-xs disabled:opacity-50 cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            {SYSTEM_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
