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
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white border border-gray-200 text-gray-600 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight m-0">
              Ticket {getShortId(ticket.id)}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">Ticket Detail View</p>
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Ticket
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* ── Summary Card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-3 mb-5">
            <StatusBadge status={ticket.status} />
            <UrgencyBadge urgency={ticket.urgencyLevel} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4 text-[#1E3A8A]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ticket ID</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 font-mono">
                  {getShortId(ticket.id)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-[#1E3A8A]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unit</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {ticket.unitNumber || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#1E3A8A]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submitted</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {formatDate(ticket.createdAt)}
                </p>
              </div>
            </div>

            {ticket.updatedAt && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-[#1E3A8A]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Updated</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {formatDate(ticket.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
            Description
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>

        {/* ── Photo Gallery ── */}
        {ticket.imageUrls && ticket.imageUrls.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              Attached Photos ({ticket.imageUrls.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ticket.imageUrls.map((url, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#1E3A8A] hover:ring-offset-1 transition-all group relative"
                  onClick={() => setFullScreenImg(getFullImageUrl(url))}
                >
                  <img
                    src={getFullImageUrl(url)}
                    alt={`Attachment ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  />
                  <div className="hidden w-full h-full items-center justify-center absolute inset-0 bg-gray-100 text-gray-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI Analysis Logs ── */}
        {ticket.agentExecutionLogs && ticket.agentExecutionLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-[#3B82F6]" />
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider m-0">
                AI Analysis History
              </h3>
            </div>
            <div className="space-y-3">
              {ticket.agentExecutionLogs.map((log, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[#3B82F6] mt-2 shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-800">{log.agentRole}</span>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="text-gray-500">{log.actionTaken}</span>
                    <div className="text-xs text-gray-400 mt-0.5">
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
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setFullScreenImg(null)}
        >
          <button
            onClick={() => setFullScreenImg(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-[61]"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullScreenImg}
            alt="Full size attachment"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !isSaving && setShowEdit(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-base font-bold text-gray-900 m-0">Edit Ticket</h4>
                <p className="text-xs text-gray-400 mt-0.5">{getShortId(ticket.id)}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                disabled={isSaving}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Error */}
            {editError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-xs text-red-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {editError}
              </div>
            )}

            {/* Edit Success */}
            {editSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4 text-xs text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Ticket updated successfully!
              </div>
            )}

            {/* Description */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all"
                minLength={5}
              />
            </div>

            {/* Urgency */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Urgency Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {URGENCY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditUrgency(opt.value)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                      editUrgency === opt.value
                        ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
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
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || editSuccess}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all"
              >
                {isSaving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
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
