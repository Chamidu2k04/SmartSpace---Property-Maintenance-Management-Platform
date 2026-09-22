import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

const STEPS = [
  ['triage', 'Triage & repair plan'],
  ['lease_policy', 'Lease & policy responsibility'],
  ['inventory', 'Inventory lookup'],
  ['scheduling', 'Scheduling & quotation'],
  ['validation', 'Deterministic validation'],
];

export default function AiWorkflowProgress({ progress }) {
  const history = progress?.execution_history || [];
  const failed = history.find((item) => item.status === 'Failed');
  const completed = new Set(history.filter((item) => item.status === 'Completed').map((item) => item.step));
  const activeIndex = Math.min(completed.size, STEPS.length - 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center">
      <section className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" role="status" aria-live="polite">
        <div className="flex items-center gap-3 mb-5">
          {failed ? <XCircle className="w-6 h-6 text-red-600" /> : <Loader2 className="w-6 h-6 text-blue-700 animate-spin" />}
          <div><h2 className="font-bold text-gray-900">Agent workflow in progress</h2><p className="text-xs text-gray-500">Run {progress?.run_id?.slice(0, 8)}</p></div>
        </div>
        <div className="space-y-3">
          {STEPS.map(([key, label], index) => {
            const event = history.find((item) => item.step === key);
            const isFailed = event?.status === 'Failed';
            const isDone = completed.has(key);
            const isActive = !failed && !isDone && index === activeIndex;
            return <div key={key} className="flex gap-3 items-start">
              {isFailed ? <XCircle className="w-5 h-5 text-red-600" /> : isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : isActive ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <Circle className="w-5 h-5 text-gray-300" />}
              <div><p className={`text-sm font-semibold ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>{label}</p>{event?.summary && <p className="text-xs text-gray-500 mt-0.5">{event.summary} · {event.duration_ms} ms</p>}</div>
            </div>;
          })}
        </div>
        <p className="text-xs text-gray-500 mt-5">No database scheduling or stock reservation happens until a Property Manager approves the validated proposal.</p>
      </section>
    </div>
  );
}
