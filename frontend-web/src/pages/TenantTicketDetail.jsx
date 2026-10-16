import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TenantLayout from "../components/tenant/TenantLayout";
import StatusBadge from "../components/StatusBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import api from "../services/api";
import {
  ArrowLeft, Pencil, Loader2, AlertTriangle, X, ImageIcon,
  CheckCircle2, Calendar, Hash, Building2, Info,
} from "lucide-react";

const BASE_URL = "http://localhost:5030";

const URGENCY_INT = { Low: 0, Medium: 1, High: 2, Emergency: 3 };
const URGENCY_OPTIONS = [
  { value: 0, label: "Low"       },
  { value: 1, label: "Medium"    },
  { value: 2, label: "High"      },
  { value: 3, label: "Emergency" },
];

export default function TenantTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket]             = useState(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState(null);
  const [fullScreenImg, setFullScreenImg] = useState(null);

  /* ── Edit modal state ── */
  const [showEdit, setShowEdit]           = useState(false);
  const [editDesc, setEditDesc]           = useState("");
  const [editUrgency, setEditUrgency]     = useState(1);
  const [isSaving, setIsSaving]           = useState(false);
  const [editError, setEditError]         = useState("");
  const [editSuccess, setEditSuccess]     = useState(false);

  /* ── Fetch ticket ── */
  useEffect(() => {
    const fetchTicket = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`/tickets/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Ticket not found.");
        }
        const data = await res.json();
        setTicket(data);
      } catch (err) {
        setError(err.message || "Failed to load ticket details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const getShortId = (rawId) => {
    if (!rawId) return "";
    return `#T-${rawId.substring(0, 8).toUpperCase()}`;
  };

  const getFullImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
  };

  const formatDate = (ds) => {
    if (!ds) return "—";
    return new Date(ds).toLocaleString("en-US", {
      month: "long", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  /* ── Open edit modal ── */
  const openEdit = () => {
    if (!ticket) return;
    setEditDesc(ticket.description);
    setEditUrgency(URGENCY_INT[ticket.urgencyLevel] ?? 1);
    setEditError("");
    setEditSuccess(false);
    setShowEdit(true);
  };

  /* ── Save edit ── */
  const handleSave = async () => {
    setEditError("");
    if (editDesc.trim().length < 5) {
      setEditError("Description must be at least 5 characters.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.put(`/tickets/${id}`, {
        description: editDesc.trim(),
        urgencyLevel: editUrgency,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Update failed (${res.status}).`);
      }
      setEditSuccess(true);
      setTicket(prev => ({
        ...prev,
        description: editDesc.trim(),
        urgencyLevel: URGENCY_OPTIONS[editUrgency]?.label || prev.urgencyLevel,
      }));
      setTimeout(() => { setShowEdit(false); setEditSuccess(false); }, 1200);
    } catch (err) {
      setEditError(err.message || "Failed to update ticket.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Render ── */
  if (isLoading) {
    return (
      <TenantLayout>
        <div className="flex items-center justify-center min-h-[60vh] gap-4 flex-col text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#1E3A8A]" />
          <p className="text-sm font-medium">Loading ticket details…</p>
        </div>
      </TenantLayout>
    );
  }

  if (error || !ticket) {
    return (
      <TenantLayout>
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white border border-gray-200 text-gray-600 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Could not load ticket</p>
            <p className="text-red-600 text-xs mt-1">{error}</p>
          </div>
        </div>
      </TenantLayout>
    );
  }

  const canEdit = ticket.status === "Submitted";

  return (
    <TenantLayout>
      {/* ── Back + Edit Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            aria-label="Back"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight m-0">
              Ticket {getShortId(ticket.id)}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Ticket Detail View</p>
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Ticket
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* ── Summary Card ── */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6">
          <div className="flex flex-wrap gap-2.5 mb-6">
            <StatusBadge status={ticket.status} />
            <UrgencyBadge urgency={ticket.urgencyLevel} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Hash className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket ID</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                  {getShortId(ticket.id)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {ticket.unitNumber || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatDate(ticket.createdAt)}
                </p>
              </div>
            </div>

            {ticket.updatedAt && (
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Updated</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatDate(ticket.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
            Description
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>

        {/* ── Photo Gallery ── */}
        {ticket.imageUrls && ticket.imageUrls.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              Attached Photos ({ticket.imageUrls.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ticket.imageUrls.map((url, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 cursor-pointer hover:ring-2 hover:ring-blue-600 hover:ring-offset-2 transition-all group relative shadow-xs"
                  onClick={() => setFullScreenImg(getFullImageUrl(url))}
                >
                  <img
                    src={getFullImageUrl(url)}
                    alt={`Attachment ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  />
                  <div className="hidden w-full h-full items-center justify-center absolute inset-0 bg-slate-100 text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI Analysis Logs ── */}
        {ticket.agentExecutionLogs && ticket.agentExecutionLogs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Info className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0">
                AI Analysis History
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {ticket.agentExecutionLogs.map((log, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0 ring-4 ring-blue-50" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{log.agentRole}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600 text-sm">{log.actionTaken}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatDate(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Not Editable Notice ── */}
        {!canEdit && (
          <div className="flex items-start gap-3 p-4 bg-blue-50/70 border border-blue-100 rounded-2xl text-sm text-blue-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <span>
              This ticket can only be edited when its status is <strong>Submitted</strong>. 
              Current status: <strong>{ticket.status}</strong>.
            </span>
          </div>
        )}
      </div>

      {/* ── Full-Screen Photo Viewer ── */}
      {fullScreenImg && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setFullScreenImg(null)}
        >
          <button
            onClick={() => setFullScreenImg(null)}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[61]"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullScreenImg}
            alt="Full size attachment"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isSaving && setShowEdit(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 sm:p-7 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-lg font-bold text-slate-900 m-0">Edit Maintenance Request</h4>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{getShortId(ticket.id)}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                disabled={isSaving}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Error */}
            {editError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50/80 border border-red-200 rounded-xl mb-4 text-xs font-medium text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{editError}</span>
              </div>
            )}

            {/* Edit Success */}
            {editSuccess && (
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl mb-4 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Ticket updated successfully!</span>
              </div>
            )}

            {/* Description */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                minLength={5}
              />
            </div>

            {/* Urgency */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Urgency Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {URGENCY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditUrgency(opt.value)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      editUrgency === opt.value
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || editSuccess}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.99]"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <>Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </TenantLayout>
  );
}
