import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/useAuthStore';
import { Search, Shield, UserCheck, AlertCircle, CheckCircle2, RefreshCw, Lock } from 'lucide-react';

const SYSTEM_ROLES = [
  'Admin',
  'Tenant',
  'PropertyManager',
  'InventoryOfficer',
  'Technician',
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            User Management & Access Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Search registered tenants, managers, and staff, and reassign system permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadUsers(searchQuery)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Client-side Notification Alerts */}
      {alert.type && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm transition-all ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-[#10B981] border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert({ type: null, message: '' })}
            className="text-xs uppercase font-bold tracking-wider hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar Card */}
      <div className="bg-[#FFFFFF] rounded-xl shadow-sm border border-gray-200/80 p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by full name or email (e.g. john@example.com)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadUsers('');
                }}
                className="absolute right-3.5 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#152865] text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Searching...' : 'Search Users'}
          </button>
        </form>
      </div>

      {/* Users Data Table Card */}
      <div className="bg-[#FFFFFF] rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#1E3A8A]" />
                      <span>Loading user records...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-gray-600">No users found</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try searching with a different term.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentUser?.id || (currentUser?.email && user.email?.toLowerCase() === currentUser.email?.toLowerCase());

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold text-xs">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{user.fullName}</span>
                              {isSelf && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-[#1E3A8A] rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-gray-400">
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
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'Tenant'
                              ? 'bg-blue-100 text-blue-800'
                              : user.role === 'Technician'
                              ? 'bg-amber-100 text-amber-800'
                              : user.role === 'InventoryOfficer'
                              ? 'bg-emerald-100 text-[#10B981]'
                              : 'bg-indigo-100 text-indigo-800'
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
                            className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium italic bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg cursor-not-allowed"
                          >
                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                            Locked (Self)
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            disabled={updatingUserId === user.id}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] shadow-sm disabled:opacity-50 cursor-pointer"
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
