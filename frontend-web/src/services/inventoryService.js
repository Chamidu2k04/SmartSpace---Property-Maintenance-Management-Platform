import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = 'http://localhost:5030/api';

/**
 * Generic authenticated fetch wrapper
 */
async function request(endpoint, options = {}) {
  // Grab token from Zustand auth store or localStorage fallback
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
      const err = new Error('Access Denied: You do not have permission to perform this action. The Inventory Officer role is required.');
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

  // If 204 No Content, return null
  if (response.status === 204) return null;
  return response.json();
}

export const inventoryService = {
  // --- INVENTORY SPARE PARTS CRUD ---

  /**
   * GET /api/inventory?category={optionalCategory}
   */
  getItems: (category = null) => {
    const query = category !== null && category !== '' ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/inventory${query}`, { method: 'GET' });
  },

  /**
   * GET /api/inventory/{id}
   */
  getItemById: (id) => {
    return request(`/inventory/${id}`, { method: 'GET' });
  },

  /**
   * POST /api/inventory
   * Payload: { supplierId, itemName, category, stockQuantity, unitCost }
   */
  createItem: (itemData) => {
    return request('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * PUT /api/inventory/{id}
   * Payload: { supplierId, itemName, category, stockQuantity, unitCost }
   */
  updateItem: (id, itemData) => {
    return request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * DELETE /api/inventory/{id}
   */
  deleteItem: (id) => {
    return request(`/inventory/${id}`, { method: 'DELETE' });
  },

  /**
   * GET /api/inventory/low-stock?threshold=5
   */
  getLowStockItems: (threshold = 5) => {
    return request(`/inventory/low-stock?threshold=${threshold}`, { method: 'GET' });
  },

  // --- SUPPLIERS CRUD ---

  /**
   * GET /api/suppliers
   */
  getSuppliers: () => {
    return request('/suppliers', { method: 'GET' });
  },

  /**
   * GET /api/suppliers/{id}
   */
  getSupplierById: (id) => {
    return request(`/suppliers/${id}`, { method: 'GET' });
  },

  /**
   * POST /api/suppliers
   * Payload: { name, contactEmail, phone }
   */
  createSupplier: (supplierData) => {
    return request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  },

  /**
   * PUT /api/suppliers/{id}
   * Payload: { name, contactEmail, phone }
   */
  updateSupplier: (id, supplierData) => {
    return request(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  },

  /**
   * DELETE /api/suppliers/{id}
   */
  deleteSupplier: (id) => {
    return request(`/suppliers/${id}`, { method: 'DELETE' });
  },
};
