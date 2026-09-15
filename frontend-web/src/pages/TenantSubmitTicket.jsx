import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TenantLayout from "../components/tenant/TenantLayout";
import api from "../services/api";
import {
  ArrowLeft, Send, ImagePlus, X, CheckCircle2, AlertTriangle, Loader2, Building2,
} from "lucide-react";

const URGENCY_OPTIONS = [
  {
    value: 0,
    label: "Low",
    description: "Minor issue, not affecting daily life",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.25)",
  },
  {
    value: 1,
    label: "Medium",
    description: "Inconvenient but manageable",
    color: "#EAB308",
    bg: "rgba(234,179,8,0.08)",
    border: "rgba(234,179,8,0.25)",
  },
  {
    value: 2,
    label: "High",
    description: "Significantly affecting comfort or safety",
    color: "#F97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
  },
  {
    value: 3,
    label: "Emergency",
    description: "Immediate risk to safety or major damage",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
  },
];

export default function TenantSubmitTicket() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [lease, setLease]               = useState(null);
  const [loadingLease, setLoadingLease] = useState(true);
  const [leaseError, setLeaseError]     = useState("");

  const [description, setDescription] = useState("");
  const [urgency, setUrgency]         = useState(null); // Explicit selection required
  const [images, setImages]           = useState([]); // File[]
  const [previews, setPreviews]       = useState([]); // data URL[]

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState(false);

  /* ── Fetch Active Lease ── */
  useEffect(() => {
    async function fetchActiveLease() {
      try {
        setLoadingLease(true);
        setLeaseError("");
        const res = await api.get("/leases/my-active");
        if (!res.ok) {
          if (res.status === 404) {
            setLease(null);
            setLeaseError("No active lease found. Please contact your property manager.");
            return;
          }
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to fetch active lease.");
        }
        const data = await res.json();
        if (data && data.unitId) {
          setLease(data);
        } else {
          setLease(null);
          setLeaseError("No active lease found. Please contact your property manager.");
        }
      } catch (err) {
        setLease(null);
        setLeaseError(err.message || "No active lease found. Please contact your property manager.");
      } finally {
        setLoadingLease(false);
      }
    }

    fetchActiveLease();
  }, []);

  /* ── File picker ── */
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    const MAX = 5;
    const combined = [...images, ...newFiles].slice(0, MAX);
    setImages(combined);

    const readers = combined.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then(setPreviews);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  /* ── Validation ── */
  const validate = () => {
    if (!lease || !lease.unitId)
      return "No active lease found. Cannot submit ticket.";
    if (description.trim().length < 5)
      return "Description must be at least 5 characters.";
    if (urgency === null || urgency === undefined)
      return "Please select an Urgency Level.";
    return null;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("UnitId", lease.unitId);
      formData.append("Description", description.trim());
      formData.append("UrgencyLevel", String(urgency));
      images.forEach(file => formData.append("Images", file));

      const res = await api.post("/tickets", formData);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Failed to submit ticket (${res.status}).`);
      }

      setSuccess(true);
      setTimeout(() => navigate("/tenant/maintenance"), 1800);
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <TenantLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Request Submitted!</h2>
            <p className="text-gray-500 text-sm">Your maintenance request has been received. Redirecting…</p>
          </div>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      {/* ── Page Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => navigate("/tenant/maintenance")}
          className="p-2 rounded-lg hover:bg-white border border-gray-200 text-gray-600 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">
            Report a Maintenance Issue
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the details below and our team will get back to you.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Unit Card / Active Lease State ── */}
        {loadingLease ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-3 text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#1E3A8A]" />
            <span>Fetching your active lease details...</span>
          </div>
        ) : leaseError ? (
          <div className="bg-red-50 rounded-xl border border-red-200 p-6 flex items-start gap-3 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 mb-0.5">⚠️ No active lease found.</p>
              <p className="text-red-600">Please contact your property manager.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E3A8A] shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base m-0">
                {lease?.propertyName || "Property"}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Unit Number: <span className="font-semibold text-gray-700">{lease?.unitNumber || "N/A"}</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Description ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Describe the issue clearly — what is wrong, where it is, how long it has been happening.
          </p>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="e.g. The kitchen tap has been dripping constantly since last week and the pressure seems low…"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all"
            required
            minLength={5}
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {description.trim().length} / min 5 chars
          </div>
        </div>

        {/* ── Urgency Level ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-4">
            Urgency Level <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {URGENCY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUrgency(opt.value)}
                className="relative flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: urgency === opt.value ? opt.color : "rgba(229,231,235,1)",
                  backgroundColor: urgency === opt.value ? opt.bg : "transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span
                    className="text-sm font-bold"
                    style={{ color: urgency === opt.value ? opt.color : "#374151" }}
                  >
                    {opt.label}
                  </span>
                </div>
                <span className="text-xs text-gray-400 leading-tight">
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Photo Upload ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Photos <span className="text-gray-400 font-normal normal-case">(optional, max 5)</span>
          </label>
          <p className="text-xs text-gray-400 mb-4">
            Attach photos of the issue to help our team assess it faster.
          </p>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 group">
                  <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 5 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#1E3A8A] hover:bg-blue-50/40 transition-all"
              >
                <ImagePlus className="w-8 h-8 text-gray-300" />
                <span className="text-sm font-medium text-gray-500">
                  Click to add photos
                </span>
                <span className="text-xs text-gray-400">
                  {images.length} / 5 selected
                </span>
              </label>
            </>
          )}
        </div>

        {/* ── Submit ── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/tenant/maintenance")}
            className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loadingLease || !lease || !lease.unitId}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1E3A8A] hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </TenantLayout>
  );
}
