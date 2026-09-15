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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">
            My Maintenance Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track and manage all your reported issues in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/tenant/submit")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#10B981]/40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total",       count: total,      color: "#1E3A8A", bg: "rgba(30,58,138,0.08)"  },
          { label: "Submitted",   count: submitted,  color: "#6B7280", bg: "rgba(107,114,128,0.08)"},
          { label: "In Progress", count: inProgress, color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
          { label: "Completed",   count: completed,  color: "#10B981", bg: "rgba(16,185,129,0.08)" },
        ].map(card => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            <div
              className="text-3xl font-extrabold mb-1"
              style={{ color: card.color }}
            >
              {card.count}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {card.label}
            </div>
            <div
              className="h-1 rounded-full mt-3"
              style={{ backgroundColor: card.color, opacity: 0.25 }}
            />
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 px-4 py-2 flex gap-1 flex-wrap">
        {FILTER_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={String(tab.key)}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#1E3A8A] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Ticket ID (e.g. #T-285611A6)..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
            {searchedTickets.length} result{searchedTickets.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Ticket List ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#1E3A8A]" />
          <p className="text-sm font-medium">Loading your maintenance requests…</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Failed to load tickets</p>
            <p className="text-red-600 text-xs mt-1">{error}</p>
            <button
              type="button"
              onClick={fetchTickets}
              className="mt-3 text-xs font-semibold text-[#1E3A8A] hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-gray-300" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">No tickets found</p>
            <p className="text-gray-400 text-xs mt-1">
              {activeFilter
                ? `No "${activeFilter}" tickets yet.`
                : "You haven't submitted any maintenance requests yet."}
            </p>
          </div>
          {!activeFilter && (
            <button
              type="button"
              onClick={() => navigate("/tenant/submit")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg hover:bg-blue-900 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Submit Your First Request
            </button>
          )}
        </div>
      ) : searchedTickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">No tickets match your search</p>
            <p className="text-gray-400 text-xs mt-1">
              No results for &quot;{searchQuery}&quot;
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs font-semibold text-[#1E3A8A] hover:underline"
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
