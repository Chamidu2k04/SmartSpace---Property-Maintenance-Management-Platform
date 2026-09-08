import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = 'http://localhost:5030/api';

/**
 * Generic authenticated fetch wrapper
 */
async function request(endpoint, options = {}) {
  const token = useAuthStore.getState().token || localStorage.getItem('smartspace_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 403) {
      const err = new Error('Access Denied: You do not have permission to perform this action.');
      err.status = 403;
      throw err;
    }

    if (response.status === 401) {
      const err = new Error('Your session has expired or you are not authorized. Please sign in again.');
      err.status = 401;
      throw err;
    }

    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) return null;
  return response.json();
}

/**
 * TradeSpecialty enum helper values & mappings
 */
export const TRADE_SPECIALTIES = ['Plumber', 'Electrician', 'Handyman'];

export const TRADE_SPECIALTY_MAP = {
  0: 'Plumber',
  1: 'Electrician',
  2: 'Handyman',
  Plumber: 'Plumber',
  Electrician: 'Electrician',
  Handyman: 'Handyman',
};

/**
 * AppointmentStatus enum helper values & mappings
 */
export const APPOINTMENT_STATUSES = ['Scheduled', 'InProgress', 'Completed', 'Cancelled'];

export const APPOINTMENT_STATUS_MAP = {
  0: 'Scheduled',
  1: 'InProgress',
  2: 'Completed',
  3: 'Cancelled',
  Scheduled: 'Scheduled',
  InProgress: 'InProgress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
};

export const technicianService = {
  // --- TECHNICIAN & USER CRUD ---

  /**
   * GET /api/technicians
   * Fetches technician records joined with user account details.
   */
  getTechnicians: () => {
    return request('/technicians', { method: 'GET' });
  },

  /**
   * GET /api/technicians/{id}
   * Fetches details for a single technician.
   */
  getTechnicianById: (id) => {
    return request(`/technicians/${id}`, { method: 'GET' });
  },

  /**
   * POST /api/technicians
   * Body: { email, fullName, password, tradeSpecialty, hourlyRate }
   * Note: tradeSpecialty can be string or numeric index (0=Plumber, 1=Electrician, 2=Handyman)
   */
  createTechnician: (data) => {
    const payload = {
      email: data.email,
      fullName: data.fullName || data.name,
      password: data.password,
      tradeSpecialty: typeof data.tradeSpecialty === 'number' ? data.tradeSpecialty : (TRADE_SPECIALTIES.indexOf(data.tradeSpecialty) >= 0 ? TRADE_SPECIALTIES.indexOf(data.tradeSpecialty) : data.tradeSpecialty),
      hourlyRate: parseFloat(data.hourlyRate),
    };
    return request('/technicians', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * PUT /api/technicians/{id}
   * Body: { email, fullName, password, tradeSpecialty, hourlyRate }
   */
  updateTechnician: (id, data) => {
    const payload = {
      email: data.email,
      fullName: data.fullName || data.name,
      ...(data.password ? { password: data.password } : {}),
      tradeSpecialty: typeof data.tradeSpecialty === 'number' ? data.tradeSpecialty : (TRADE_SPECIALTIES.indexOf(data.tradeSpecialty) >= 0 ? TRADE_SPECIALTIES.indexOf(data.tradeSpecialty) : data.tradeSpecialty),
      hourlyRate: parseFloat(data.hourlyRate),
    };
    return request(`/technicians/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * DELETE /api/technicians/{id}
   * Soft-deletes or deactivates the technician profile.
   */
  deactivateTechnician: (id) => {
    return request(`/technicians/${id}`, { method: 'DELETE' });
  },

  // --- APPOINTMENT CRUD ---

  /**
   * GET /api/appointments
   * Retrieves scheduled maintenance appointments.
   */
  getAppointments: async (filters = {}) => {
    const appointments = await request('/appointments', { method: 'GET' });
    let result = Array.isArray(appointments) ? appointments : [];

    if (filters.status && filters.status !== 'All') {
      result = result.filter((app) => {
        const mappedStatus = APPOINTMENT_STATUS_MAP[app.status] || app.status;
        return mappedStatus === filters.status;
      });
    }

    if (filters.date) {
      result = result.filter((app) => app.scheduledDate === filters.date);
    }

    if (filters.technicianId) {
      result = result.filter((app) => app.technicianId === filters.technicianId);
    }

    return result;
  },

  /**
   * GET /api/appointments/technician/{technicianId}
   */
  getAppointmentsByTechnicianId: (technicianId) => {
    return request(`/appointments/technician/${technicianId}`, { method: 'GET' });
  },

  /**
   * GET /api/appointments/{id}
   */
  getAppointmentById: (id) => {
    return request(`/appointments/${id}`, { method: 'GET' });
  },

  /**
   * POST /api/appointments
   * Payload: { ticketId, technicianId, scheduledDate, startTime, endTime }
   */
  createAppointment: (data) => {
    const payload = {
      ticketId: data.ticketId,
      technicianId: data.technicianId,
      scheduledDate: data.scheduledDate,
      startTime: data.startTime.length === 5 ? `${data.startTime}:00` : data.startTime,
      endTime: data.endTime.length === 5 ? `${data.endTime}:00` : data.endTime,
    };
    return request('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * PUT /api/appointments/{id}/schedule
   * Payload: { scheduledDate, startTime, endTime, status, technicianId }
   */
  updateAppointment: (id, data) => {
    const payload = {
      scheduledDate: data.scheduledDate,
      startTime: data.startTime.length === 5 ? `${data.startTime}:00` : data.startTime,
      endTime: data.endTime.length === 5 ? `${data.endTime}:00` : data.endTime,
      ...(data.status !== undefined ? { status: typeof data.status === 'number' ? data.status : (APPOINTMENT_STATUSES.indexOf(data.status) >= 0 ? APPOINTMENT_STATUSES.indexOf(data.status) : data.status) } : {}),
      ...(data.technicianId ? { technicianId: data.technicianId } : {}),
    };
    return request(`/appointments/${id}/schedule`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * PUT /api/appointments/{id}/cancel
   * Sets appointment status to "Cancelled".
   */
  cancelAppointment: (id) => {
    return request(`/appointments/${id}/cancel`, { method: 'PUT' });
  },

  // --- QUOTATION MANAGEMENT ---

  /**
   * GET /api/quotations
   * Lists all quotations.
   */
  getQuotations: () => {
    return request('/quotations', { method: 'GET' });
  },

  /**
   * GET /api/quotations/{id}
   * Fetches itemized breakdown for a single quotation.
   */
  getQuotationById: (id) => {
    return request(`/quotations/${id}`, { method: 'GET' });
  },

  /**
   * GET /api/quotations/ticket/{ticketId}
   */
  getQuotationByTicketId: (ticketId) => {
    return request(`/quotations/ticket/${ticketId}`, { method: 'GET' });
  },

  /**
   * POST /api/quotations
   * Payload: { ticketId, laborCost, partsCost }
   * Note: Total cost is calculated server-side as (LaborCost + PartsCost)
   */
  createQuotation: (data) => {
    const payload = {
      ticketId: data.ticketId,
      laborCost: parseFloat(data.laborCost),
      partsCost: parseFloat(data.partsCost),
    };
    return request('/quotations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /api/quotations/{id}/approve
   * Sets isApproved: true and triggers backend email notification confirmation.
   */
  approveQuotation: (id) => {
    return request(`/quotations/${id}/approve`, { method: 'POST' });
  },

  /**
   * GET /api/tickets
   */
  getTickets: () => {
    return request('/tickets', { method: 'GET' });
  },
};
