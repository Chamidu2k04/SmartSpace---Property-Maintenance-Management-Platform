import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TenantLayout from "../components/tenant/TenantLayout";
import TicketCard from "../components/tenant/TicketCard";
import api from "../services/api";
import {
  ClipboardList, Plus, AlertTriangle, Loader2, RefreshCw,
  CheckCircle2, Clock, Send, Filter, Search, X,
} from "lucide-react";

/** Status filter tabs for the ticket list */
const FILTER_TABS = [
  { key: null,             label: "All",        icon: ClipboardList },
  { key: "Submitted",      label: "Submitted",  icon: Send          },
  { key: "Analyzing",      label: "Analyzing",  icon: Clock         },
  { key: "PendingApproval",label: "Pending",    icon: Filter        },
  { key: "Scheduled",      label: "Scheduled",  icon: Clock         },
  { key: "Completed",      label: "Completed",  icon: CheckCircle2  },
];

export default function TenantMaintenance() {
  const navigate = useNavigate();
  const [tickets, setTickets]       = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState(null);
  const [activeFilter, setFilter]   = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/tickets/my-tickets");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load your maintenance requests.");
      }
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  /* ── Derived stats ── */
  const total      = tickets.length;
  const submitted  = tickets.filter(t => t.status === "Submitted").length;
  const inProgress = tickets.filter(
    t => ["Analyzing", "PendingApproval", "Scheduled"].includes(t.status)
  ).length;
  const completed  = tickets.filter(t => t.status === "Completed").length;

  const filteredTickets = activeFilter
    ? tickets.filter(t => t.status === activeFilter)
    : tickets;

  // Search filter on top of status filter — by Ticket ID
  const getShortId = (id) => id ? `#T-${id.substring(0, 8).toUpperCase()}` : '';
  const searchedTickets = searchQuery.trim()
    ? filteredTickets.filter(t => {
        const query = searchQuery.toLowerCase().replace('#', '');
        const shortId = t.id ? `t-${t.id.substring(0, 8)}`.toLowerCase() : '';
        return shortId.includes(query) || t.id?.toLowerCase().includes(query);
      })
    : filteredTickets;

  return (
    <TenantLayout>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
            My Maintenance Requests
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track and manage all your reported issues in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/tenant/submit")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total",       count: total,      color: "#1e3a8a" },
          { label: "Submitted",   count: submitted,  color: "#64748b" },
          { label: "In Progress", count: inProgress, color: "#2563eb" },
          { label: "Completed",   count: completed,  color: "#10b981" },
        ].map(card => (
          <div
            key={card.label}
            className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 hover:shadow-md transition-shadow"
          >
            <div
              className="text-3xl font-extrabold mb-1"
              style={{ color: card.color }}
            >
              {card.count}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {card.label}
            </div>
            <div
              className="h-1 rounded-full mt-3"
              style={{ backgroundColor: card.color, opacity: 0.3 }}
            />
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-6 p-1.5 flex gap-1.5 items-center overflow-x-auto">
        {FILTER_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={String(tab.key)}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={fetchTickets}
          disabled={isLoading}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="mb-5 flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Ticket ID (e.g. #T-285611A6)..."
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all text-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
            {searchedTickets.length} result{searchedTickets.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Ticket List ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Loading your maintenance requests…</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-700 text-sm">Failed to load tickets</p>
            <p className="text-rose-600 text-xs mt-1">{error}</p>
            <button
              type="button"
              onClick={fetchTickets}
              className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-slate-300" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base">No tickets found</p>
            <p className="text-slate-500 text-xs mt-1">
              {activeFilter
                ? `No "${activeFilter}" tickets yet.`
                : "You haven't submitted any maintenance requests yet."}
            </p>
          </div>
          {!activeFilter && (
            <button
              type="button"
              onClick={() => navigate("/tenant/submit")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Report Issue
            </button>
          )}
        </div>
      ) : searchedTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base">No tickets match your search</p>
            <p className="text-slate-500 text-xs mt-1">
              No results for &quot;{searchQuery}&quot;
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searchedTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </TenantLayout>
  );
}
