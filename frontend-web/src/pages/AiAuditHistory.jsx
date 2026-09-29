import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Search, ShieldCheck, Sparkles, Bot } from 'lucide-react';
import { getAllAiAuditLogs } from '../services/aiService';

const shortId = (value) => value ? value.slice(0, 8).toUpperCase() : '—';

export default function AiAuditHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true); 
    setError(null);
    try { setLogs(await getAllAiAuditLogs()); }
    catch (err) { setError(err.message || 'AI audit history is unavailable.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  
  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return logs;
    return logs.filter((log) => [log.ticket_id, log.run_id, log.agent_role, log.action_taken, log.workflow_outcome]
      .some((field) => String(field || '').toLowerCase().includes(value)));
  }, [logs, query]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <Bot className="w-3.5 h-3.5" /> AI Governance & Observability
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight m-0">AI Audit History</h1>
          <p className="text-sm text-slate-500 mt-1">Persisted, tamper-evident evidence for agent executions, validation steps, and human decisions</p>
        </div>
        <button 
          onClick={load} 
          disabled={loading} 
          className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/70 flex items-start gap-3 text-sm text-blue-900 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="m-0 leading-relaxed">
          This audit trail intentionally excludes API credentials, raw model system prompts, telemetry tokens, and stack traces to ensure strict compliance and data protection.
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          value={query} 
          onChange={(event) => setQuery(event.target.value)} 
          placeholder="Search by ticket ID, run ID, agent role, or outcome…" 
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-xs transition-all" 
        />
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center text-slate-500 shadow-xs flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="font-medium">Loading persisted AI audit records…</span>
        </div>
      ) : !error && visible.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
          <Bot className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Matching AI Records</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">No AI audit events match your active search filter.</p>
        </div>
      ) : !error && (
        <div className="space-y-4">
          {visible.map((log) => (
            <article key={log.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {log.step_status === 'Failed' ? (
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-slate-900 text-base m-0">{log.agent_role}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Ticket #{shortId(log.ticket_id)} · <span className="font-sans">{log.step || 'human_decision'} · {log.step_status || log.approval_status || 'Recorded'}</span>
                    </p>
                  </div>
                </div>
                <time className="text-xs font-medium text-slate-400">{new Date(log.created_at).toLocaleString()}</time>
              </div>

              <p className="text-sm text-slate-700 mt-4 leading-relaxed font-medium">{log.action_taken}</p>

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                <Detail label="Run ID" value={log.run_id} mono />
                <Detail label="Outcome" value={log.workflow_outcome} />
                <Detail label="Duration" value={log.duration_ms == null ? null : `${log.duration_ms} ms`} />
                <Detail label="Error Code" value={log.error_code || 'None'} />
                <Detail label="Validation" value={log.validation_passed == null ? 'Not reached' : log.validation_passed ? 'Passed' : 'Failed'} />
                <Detail label="Approval" value={log.approval_status} />
                <Detail label="Appointment" value={log.appointment_id} mono />
                <Detail label="Quotation" value={log.quotation_id} mono />
              </dl>

              {(log.technician_name || log.inventory_items?.length > 0) && (
                <div className="grid md:grid-cols-2 gap-3.5 mt-4 text-xs">
                  <div className="border border-slate-200/80 bg-slate-50/50 rounded-xl p-4">
                    <h3 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">Proposed Inventory Parts</h3>
                    {log.inventory_items?.length ? log.inventory_items.map((item) => (
                      <div key={item.item_id} className="flex justify-between gap-3 py-1 font-medium text-slate-700">
                        <span>{item.item_name} × {item.quantity}</span>
                        <span className="font-mono">Rs. {Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    )) : (
                      <p className="text-slate-400 italic">No parts proposed.</p>
                    )}
                    <p className="border-t border-slate-200 mt-2.5 pt-2.5 font-bold text-slate-900 flex justify-between">
                      <span>Parts Cost:</span>
                      <span className="font-mono">Rs. {Number(log.parts_cost || 0).toFixed(2)}</span>
                    </p>
                  </div>

                  <div className="border border-slate-200/80 bg-slate-50/50 rounded-xl p-4">
                    <h3 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">Proposed Schedule & Estimate</h3>
                    <div className="space-y-1 text-slate-700">
                      <p><span className="text-slate-400 font-medium">Technician:</span> <span className="font-semibold">{log.technician_name || '—'}</span></p>
                      <p><span className="text-slate-400 font-medium">Date:</span> {log.proposed_date || '—'}</p>
                      <p><span className="text-slate-400 font-medium">Window:</span> {log.proposed_start_time || '—'} – {log.proposed_end_time || '—'}</p>
                      <p className="pt-1"><span className="text-slate-400 font-medium">Labor:</span> Rs. {Number(log.labor_cost || 0).toFixed(2)}</p>
                    </div>
                    <p className="border-t border-slate-200 mt-2.5 pt-2.5 font-bold text-slate-900 flex justify-between">
                      <span>Validated Total:</span>
                      <span className="font-mono text-emerald-700 font-bold">Rs. {Number(log.total_cost || 0).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              )}

              {log.final_outcome && (
                <div className="mt-3.5 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                  <strong className="font-bold text-slate-900">Final Outcome:</strong> {log.final_outcome}
                </div>
              )}

              {log.reservation_ids?.length > 0 && (
                <p className="mt-2 text-xs text-slate-400 font-mono break-all">
                  Reservations: {log.reservation_ids.join(', ')}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, mono = false }) { 
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs">
      <dt className="uppercase font-bold text-[10px] text-slate-400 tracking-wider">{label}</dt>
      <dd className={`mt-1 break-all text-slate-800 font-semibold ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  ); 
}
