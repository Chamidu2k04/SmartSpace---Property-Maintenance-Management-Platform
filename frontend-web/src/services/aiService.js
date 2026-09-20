import api from './api';

async function read(response, fallback) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || body?.message || fallback);
  return body;
}

export async function planMaintenance(ticketId, preferredDate = null, runId = null) {
  return read(await api.post('/ai/workflow/plan-maintenance', {
    ticket_id: ticketId,
    preferred_date: preferredDate || null,
    run_id: runId,
  }), 'AI analysis failed.');
}

export async function getWorkflowStatus(ticketId, runId) {
  return read(await api.get(`/ai/tickets/${ticketId}/runs/${runId}/status`), 'AI workflow status is unavailable.');
}

export async function getAiAuditLogs(ticketId) {
  return read(await api.get(`/ai/tickets/${ticketId}/audit-logs`), 'AI audit history is unavailable.');
}

export async function getAllAiAuditLogs() {
  return read(await api.get('/ai/audit-logs'), 'AI audit history is unavailable. Restart the ASP.NET backend and try again.');
}

export async function getMaintenanceProposal(ticketId) {
  return read(await api.get(`/ai/tickets/${ticketId}/proposal`), 'No AI proposal is available.');
}

export async function approveMaintenanceProposal(ticketId) {
  return read(await api.post(`/ai/tickets/${ticketId}/approve`, {}), 'The proposal could not be approved.');
}

export async function rejectMaintenanceProposal(ticketId, reason) {
  const response = await api.post(`/ai/tickets/${ticketId}/reject`, { reason });
  if (!response.ok) await read(response, 'The proposal could not be rejected.');
}
