const AI_BASE_URL = import.meta.env?.VITE_AI_SERVICE_BASE_URL || 'http://localhost:8000/api';

async function aiRequest(path, options = {}) {
  const token = localStorage.getItem('smartspace_token');
  const response = await fetch(`${AI_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (response.status === 401) {
    localStorage.removeItem('smartspace_token');
    localStorage.removeItem('smartspace_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  return response;
}

async function read(response, fallback) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || body?.message || (typeof body?.detail === 'string' ? body.detail : null) || fallback);
  return body;
}

export async function planMaintenance(ticketId, preferredDate = null, runId = null) {
  return read(await aiRequest('/ai/workflow/plan-maintenance', { method: 'POST', body: JSON.stringify({
    ticket_id: ticketId, preferred_date: preferredDate || null, run_id: runId,
  }) }), 'AI analysis failed.');
}

export async function getWorkflowStatus(ticketId, runId) {
  return read(await aiRequest(`/ai/tickets/${ticketId}/runs/${runId}/status`), 'AI workflow status is unavailable.');
}

export async function getAiAuditLogs(ticketId) {
  return read(await aiRequest(`/ai/tickets/${ticketId}/audit-logs`), 'AI audit history is unavailable.');
}

export async function getAllAiAuditLogs() {
  return read(await aiRequest('/ai/audit-logs'), 'AI audit history is unavailable. Start the Python AI service and try again.');
}

export async function getMaintenanceProposal(ticketId) {
  return read(await aiRequest(`/ai/tickets/${ticketId}/proposal`), 'No AI proposal is available.');
}

export async function approveMaintenanceProposal(ticketId) {
  return read(await aiRequest(`/ai/tickets/${ticketId}/approve`, { method: 'POST', body: '{}' }), 'The proposal could not be approved.');
}

export async function rejectMaintenanceProposal(ticketId, reason) {
  const response = await aiRequest(`/ai/tickets/${ticketId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
  if (!response.ok) await read(response, 'The proposal could not be rejected.');
}
