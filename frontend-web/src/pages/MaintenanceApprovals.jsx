import React, { useState, useEffect, useCallback } from 'react';
import { getTickets } from '../services/ticketService';
import TicketsTable from '../components/TicketsTable';
import {
  ClipboardList,
  Loader2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle2,
  Send,
} from 'lucide-react';

/** Status filter tabs */
const FILTER_TABS = [
  { key: null, label: 'All Tickets', icon: ClipboardList },
  { key: 'Submitted', label: 'Submitted', icon: Send },
  { key: 'Analyzing', label: 'Analyzing', icon: Clock },
  { key: 'PendingApproval', label: 'Pending', icon: FileText },
  { key: 'Scheduled', label: 'Scheduled', icon: Clock },
  { key: 'Completed', label: 'Completed', icon: CheckCircle2 },
];

export default function MaintenanceApprovals() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  const fetchTickets = useCallback(async (statusFilter = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTickets(statusFilter);
      setTickets(data);
    } catch (err) {
      setError(err.message || 'Failed to load tickets.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch tickets on mount and when filter changes
  useEffect(() => {
    fetchTickets(activeFilter);
  }, [activeFilter, fetchTickets]);

  /** Optimistic update: change ticket status locally without refetching */
  const handleTicketUpdated = (ticketId, newStatusName) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatusName } : t))
    );
  };

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
  };

  const handleRefresh = () => {
    fetchTickets(activeFilter);
  };

  // Compute stats from current ticket data
  const stats = {
    total: tickets.length,
    submitted: tickets.filter((t) => t.status === 'Submitted').length,
    inProgress: tickets.filter((t) =>
      ['Analyzing', 'PendingApproval', 'Scheduled'].includes(t.status)
    ).length,
    completed: tickets.filter((t) => t.status === 'Completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">
            Maintenance Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View, manage, and update tenant maintenance tickets
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={stats.total}
          color="#1E3A8A"
          icon={ClipboardList}
        />
        <StatCard
          label="Submitted"
          value={stats.submitted}
          color="#6B7280"
          icon={Send}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          color="#3B82F6"
          icon={Clock}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          color="#10B981"
          icon={CheckCircle2}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.label}
              onClick={() => handleFilterChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${isActive
                  ? 'bg-[#1E3A8A] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRefresh} />
      ) : (
        <TicketsTable tickets={tickets} onTicketUpdated={handleTicketUpdated} />
      )}
    </div>
  );
}

/** Stats card sub-component */
function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}10`, color: color }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider m-0">{label}</p>
        <p className="text-2xl font-bold text-gray-900 m-0 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/** Loading skeleton sub-component */
function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header skeleton */}
      <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4 flex gap-6">
        {[80, 60, 200, 80, 80, 90, 130].map((w, i) => (
          <div
            key={i}
            className="h-3 bg-gray-200 rounded animate-pulse"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-5 py-5 flex items-center gap-6 border-b border-gray-50">
          <div className="h-3 w-6 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 flex-1 bg-gray-100 rounded animate-pulse" />
          <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/** Error state sub-component */
function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-white rounded-xl border border-red-100 shadow-sm p-12 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Failed to load tickets</h3>
      <p className="text-sm text-gray-500 mb-5">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
