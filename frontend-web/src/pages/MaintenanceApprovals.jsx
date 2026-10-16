import React, { useState, useEffect, useCallback } from 'react';
import { getTickets } from '../services/ticketService';
import TicketsTable from '../components/TicketsTable';
import AiMaintenanceReviewModal from '../components/ai/AiMaintenanceReviewModal';
import AiWorkflowProgress from '../components/ai/AiWorkflowProgress';
import { approveMaintenanceProposal, getMaintenanceProposal, getWorkflowStatus, planMaintenance, rejectMaintenanceProposal } from '../services/aiService';
import {
  ClipboardList,
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
  { key: 'ClosedNoAction', label: 'No Action', icon: CheckCircle2 },
];

export default function MaintenanceApprovals() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [aiWorkingId, setAiWorkingId] = useState(null);
  const [review, setReview] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [workflowProgress, setWorkflowProgress] = useState(null);

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

  /** Optimistic delete: remove ticket from local list without refetching */
  const handleTicketDeleted = (ticketId) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
  };

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
  };

  const handleRefresh = () => {
    fetchTickets(activeFilter);
  };

  const openProposal = async (ticket, runAnalysis = false) => {
    setAiWorkingId(ticket.id); setAiError(null);
    let pollTimer;
    let pollInProgress = false;
    try {
      let proposal;
      if (runAnalysis) {
        const runId = crypto.randomUUID();
        setWorkflowProgress({ run_id: runId, current_step: 'triage', execution_history: [] });
        pollTimer = window.setInterval(async () => {
          if (pollInProgress) return;
          pollInProgress = true;
          try { setWorkflowProgress(await getWorkflowStatus(ticket.id, runId)); } catch { /* first log may not exist yet */ }
          finally { pollInProgress = false; }
        }, 1500);
        proposal = await planMaintenance(ticket.id, null, runId);
        setWorkflowProgress(proposal);
      } else {
        proposal = await getMaintenanceProposal(ticket.id);
      }
      setReview({ ticket, proposal });
      await fetchTickets(activeFilter);
    } catch (err) { setAiError(err.message); }
    finally {
      if (pollTimer) window.clearInterval(pollTimer);
      setAiWorkingId(null);
      setWorkflowProgress(null);
    }
  };

  const approveProposal = async () => {
    setAiWorkingId(review.ticket.id); setAiError(null);
    try { await approveMaintenanceProposal(review.ticket.id); setReview(null); await fetchTickets(activeFilter); }
    catch (err) { setAiError(err.message); }
    finally { setAiWorkingId(null); }
  };

  const rejectProposal = async (reason) => {
    setAiWorkingId(review.ticket.id); setAiError(null);
    try { await rejectMaintenanceProposal(review.ticket.id, reason); setReview(null); await fetchTickets(activeFilter); }
    catch (err) { setAiError(err.message); }
    finally { setAiWorkingId(null); }
  };


  // Compute stats from current ticket data
  const stats = {
    total: tickets.length,
    submitted: tickets.filter((t) => t.status === 'Submitted').length,
    inProgress: tickets.filter((t) =>
      ['Analyzing', 'PendingApproval', 'Scheduled'].includes(t.status)
    ).length,
    completed: tickets.filter((t) => ['Completed', 'ClosedNoAction'].includes(t.status)).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
            Maintenance Requests
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            View, manage, and update tenant maintenance tickets
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={stats.total}
          color="#1e3a8a"
          icon={ClipboardList}
        />
        <StatCard
          label="Submitted"
          value={stats.submitted}
          color="#64748b"
          icon={Send}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          color="#2563eb"
          icon={Clock}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          color="#10b981"
          icon={CheckCircle2}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.label}
              onClick={() => handleFilterChange(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {aiError && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{aiError}</div>}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRefresh} />
      ) : (
        <TicketsTable
          tickets={tickets}
          onTicketUpdated={handleTicketUpdated}
          onTicketDeleted={handleTicketDeleted}
          onAnalyze={(ticket) => openProposal(ticket, true)}
          onReview={(ticket) => openProposal(ticket, false)}
          aiWorkingId={aiWorkingId}
        />
      )}
      {review && <AiMaintenanceReviewModal ticket={review.ticket} proposal={review.proposal} busy={aiWorkingId === review.ticket.id} onClose={() => setReview(null)} onApprove={approveProposal} onReject={rejectProposal} />}
      {aiWorkingId && workflowProgress && !review && <AiWorkflowProgress progress={workflowProgress} />}
    </div>
  );
}

/** Stats card sub-component */
function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 m-0 mt-0.5">{value}</p>
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
