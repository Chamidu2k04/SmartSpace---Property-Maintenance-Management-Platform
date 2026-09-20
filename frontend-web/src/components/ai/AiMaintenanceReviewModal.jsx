import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react';

const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AiMaintenanceReviewModal({ ticket, proposal, busy, onClose, onApprove, onReject }) {
  const [reason, setReason] = useState('');
  const policy = proposal?.policy;
  const triage = proposal?.triage;
  const inventory = proposal?.inventory;
  const scheduling = proposal?.scheduling;
  const tenantLiability = policy?.liability?.startsWith('Tenant');
  const noActionReview = proposal?.workflow_outcome === 'NoActionReview';
  const tenantReview = proposal?.workflow_outcome === 'TenantResponsibilityReview';
  const decisionOnly = noActionReview || tenantReview;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={busy ? undefined : onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl mx-auto my-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b flex items-start justify-between bg-slate-50">
          <div><p className="text-xs font-semibold text-blue-700 uppercase">AI maintenance proposal</p><h2 className="text-xl font-bold text-gray-900">Ticket #{ticket.id.slice(0, 8).toUpperCase()}</h2><p className="text-sm text-gray-500 mt-1">Review every recommendation before creating operational records.</p></div>
          <button disabled={busy} onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {noActionReview ? <div className="p-4 rounded-xl border bg-slate-50 border-slate-200"><div className="flex gap-3"><ShieldCheck className="w-5 h-5 mt-0.5 text-slate-700" /><div><h3 className="font-bold text-gray-900">No maintenance action recommended</h3><p className="text-sm text-gray-700 mt-1">{triage?.relevance_reason}</p><p className="text-xs text-gray-500 mt-2">A Property Manager must confirm this classification. The AI has not closed the ticket.</p></div></div></div> : <div className={`p-4 rounded-xl border ${tenantLiability ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex gap-3"><ShieldCheck className={`w-5 h-5 mt-0.5 ${tenantLiability ? 'text-amber-700' : 'text-emerald-700'}`} /><div><h3 className="font-bold text-gray-900">{policy?.liability}</h3><p className="text-sm text-gray-700 mt-1">{policy?.reasoning}</p><p className="text-xs text-gray-500 mt-2">{policy?.policy_clause} · Confidence {Math.round(Number(policy?.confidence_score || 0) * 100)}%</p>{policy?.requires_deposit_deduction && <p className="text-sm font-semibold text-amber-800 mt-2">Deposit deduction is recommended for human review only. No charge has been made.</p>}</div></div>
          </div>}

          {!decisionOnly && <div className="grid md:grid-cols-2 gap-4">
            <Card title="Triage & repair plan"><Row label="Trade" value={triage?.trade_required} /><Row label="Urgency" value={triage?.urgency_level} /><p className="text-sm text-gray-600 mt-3">{triage?.triage_summary}</p><ol className="list-decimal ml-5 mt-3 text-sm text-gray-600 space-y-1">{triage?.planned_steps?.map((step) => <li key={step}>{step}</li>)}</ol></Card>
            <Card title="Technician & schedule"><Row label="Technician" value={scheduling?.technician_name} /><Row label="Date" value={scheduling?.proposed_date} /><Row label="Time" value={`${scheduling?.proposed_start_time || ''} – ${scheduling?.proposed_end_time || ''}`} /><Row label="Estimated hours" value={scheduling?.estimated_hours} /></Card>
            <Card title="Proposed inventory"><div className="space-y-2">{inventory?.inventory_items?.length ? inventory.inventory_items.map((item) => <div key={item.item_id} className="flex justify-between text-sm"><span>{item.item_name} × {item.quantity}</span><span className="font-semibold">${money(item.subtotal)}</span></div>) : <p className="text-sm text-gray-500">No parts proposed.</p>}</div></Card>
            <Card title="Quotation"><Row label="Parts" value={`$${money(inventory?.estimated_parts_cost)}`} /><Row label="Labour" value={`$${money(scheduling?.estimated_labor_cost)}`} /><div className="border-t mt-3 pt-3"><Row label="Estimated total" value={`$${money(scheduling?.total_estimated_cost)}`} strong /></div></Card>
          </div>}

          {decisionOnly && <Card title="Human decision required"><p className="text-sm text-gray-600">Inventory, scheduling, quotation and all operational database writes were intentionally skipped. Confirm the recommendation to close this ticket without landlord maintenance action, or reject it and return it for correction.</p></Card>}

          <div className={`flex gap-3 p-4 rounded-xl border ${proposal?.validation_passed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            {proposal?.validation_passed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}<div><p className="font-semibold text-sm">{proposal?.validation_passed ? 'Deterministic validation passed' : 'Validation failed'}</p><p className="text-xs text-gray-500 mt-1">Run ID: {proposal?.run_id}</p></div>
          </div>

          <Card title="Auditable agent timeline">
            <div className="space-y-2">{proposal?.execution_history?.map((event) => <div key={`${event.step}-${event.started_at}`} className="flex justify-between gap-4 text-xs"><span><strong>{event.agent_role}</strong> — {event.summary}</span><span className="whitespace-nowrap text-gray-500">{event.duration_ms} ms</span></div>)}</div>
          </Card>

          <div><label className="text-xs font-semibold text-gray-600">Rejection reason (optional)</label><textarea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full border rounded-lg p-3 text-sm" placeholder="Explain what needs to be reconsidered…" /></div>
        </div>

        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
          <button disabled={busy} onClick={() => onReject(reason)} className="px-4 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-semibold disabled:opacity-50">Reject / Re-analyze</button>
          <button disabled={busy || !proposal?.validation_passed} onClick={onApprove} className="px-5 py-2.5 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2">{busy && <Loader2 className="w-4 h-4 animate-spin" />}{decisionOnly ? 'Confirm no-action decision' : 'Approve plan'}</button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) { return <section className="border border-gray-200 rounded-xl p-4"><h3 className="text-sm font-bold text-gray-900 mb-3">{title}</h3>{children}</section>; }
function Row({ label, value, strong }) { return <div className={`flex justify-between gap-4 text-sm py-1 ${strong ? 'font-bold text-gray-900' : 'text-gray-600'}`}><span>{label}</span><span className="text-right">{value ?? '—'}</span></div>; }
