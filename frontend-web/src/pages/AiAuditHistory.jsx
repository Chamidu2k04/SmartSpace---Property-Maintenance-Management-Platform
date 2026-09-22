import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { getAllAiAuditLogs } from '../services/aiService';

const shortId = (value) => value ? value.slice(0, 8).toUpperCase() : '—';

export default function AiAuditHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true); setError(null);
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

  return <div className="space-y-6">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">AI Audit History</h1><p className="text-sm text-gray-500 mt-1">Persisted, read-only evidence for agent runs, validation and human decisions.</p></div><button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg text-sm font-medium disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button></div>
    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 flex gap-3"><ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" /><p className="text-sm text-blue-900">This view intentionally excludes API keys, prompts, raw provider responses, stack traces and hidden reasoning.</p></div>
    <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket, run, agent or outcome…" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm" /></div>
    {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex gap-2 text-sm"><AlertTriangle className="w-5 h-5" />{error}</div>}
    {loading ? <div className="bg-white border rounded-xl p-16 text-center text-gray-500">Loading persisted audit records…</div> : !error && visible.length === 0 ? <div className="bg-white border rounded-xl p-16 text-center text-gray-500">No matching AI audit records were found.</div> : !error && <div className="space-y-4">{visible.map((log) => <article key={log.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap justify-between gap-3"><div className="flex items-center gap-3">{log.step_status === 'Failed' ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}<div><h2 className="font-bold text-gray-900">{log.agent_role}</h2><p className="text-xs text-gray-500">Ticket #{shortId(log.ticket_id)} · {log.step || 'human_decision'} · {log.step_status || log.approval_status || 'Recorded'}</p></div></div><time className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</time></div>
      <p className="text-sm text-gray-700 mt-3">{log.action_taken}</p>
      <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4"><Detail label="Run ID" value={log.run_id} mono /><Detail label="Outcome" value={log.workflow_outcome} /><Detail label="Duration" value={log.duration_ms == null ? null : `${log.duration_ms} ms`} /><Detail label="Error" value={log.error_code || 'None'} /><Detail label="Validation" value={log.validation_passed == null ? 'Not reached' : log.validation_passed ? 'Passed' : 'Failed'} /><Detail label="Approval" value={log.approval_status} /><Detail label="Appointment" value={log.appointment_id} mono /><Detail label="Quotation" value={log.quotation_id} mono /></dl>
      {(log.technician_name || log.inventory_items?.length > 0) && <div className="grid md:grid-cols-2 gap-3 mt-3 text-xs"><div className="border rounded-lg p-3"><h3 className="font-bold text-gray-800 mb-2">Trusted inventory proposal</h3>{log.inventory_items?.length ? log.inventory_items.map((item) => <div key={item.item_id} className="flex justify-between gap-3 py-1"><span>{item.item_name} × {item.quantity}</span><span>${Number(item.subtotal).toFixed(2)}</span></div>) : <p className="text-gray-500">No parts proposed.</p>}<p className="border-t mt-2 pt-2 font-semibold">Parts: ${Number(log.parts_cost || 0).toFixed(2)}</p></div><div className="border rounded-lg p-3"><h3 className="font-bold text-gray-800 mb-2">Trusted schedule and quotation</h3><p>Technician: {log.technician_name || '—'}</p><p>Date: {log.proposed_date || '—'}</p><p>Time: {log.proposed_start_time || '—'} – {log.proposed_end_time || '—'}</p><p className="mt-2">Labour: ${Number(log.labor_cost || 0).toFixed(2)}</p><p className="font-semibold">Validated total: ${Number(log.total_cost || 0).toFixed(2)}</p></div></div>}
      {log.final_outcome && <p className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-gray-700"><strong>Final outcome:</strong> {log.final_outcome}</p>}
      {log.reservation_ids?.length > 0 && <p className="mt-2 text-xs text-gray-500 break-all"><strong>Reservations:</strong> {log.reservation_ids.join(', ')}</p>}
    </article>)}</div>}
  </div>;
}

function Detail({ label, value, mono = false }) { return <div className="bg-gray-50 rounded-lg p-2.5 text-xs"><dt className="uppercase font-semibold text-gray-400">{label}</dt><dd className={`mt-1 break-all text-gray-700 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd></div>; }
