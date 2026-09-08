import api from './api';

/**
 * Fetch all maintenance tickets (Property Manager endpoint).
 * GET /api/tickets?status={optional}
 *
 * @param {string|null} statusFilter - Optional status to filter by (e.g. "Submitted", "Completed")
 * @returns {Promise<Array>} Array of ticket summary objects
 */
export async function getTickets(statusFilter = null) {
  const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
  const response = await api.get(`/tickets${query}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch tickets.');
  }

  return response.json();
}

/**
 * Update the status of a ticket.
 * PATCH /api/tickets/{id}/status
 *
 * @param {string} ticketId - The GUID of the ticket
 * @param {number} newStatus - The new TicketStatus enum value (0-4)
 * @returns {Promise<void>}
 */
export async function updateTicketStatus(ticketId, newStatus) {
  const response = await api.patch(`/tickets/${ticketId}/status`, {
    status: newStatus,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update ticket status.');
  }
}

/**
 * Soft-delete a ticket (Property Manager only).
 * DELETE /api/tickets/{id}
 *
 * @param {string} ticketId - The GUID of the ticket
 * @returns {Promise<void>}
 */
export async function deleteTicket(ticketId) {
  const response = await api.delete(`/tickets/${ticketId}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete ticket.');
  }
}
