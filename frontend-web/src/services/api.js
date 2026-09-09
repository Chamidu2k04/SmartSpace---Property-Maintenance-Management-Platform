const BASE_URL = 'http://localhost:5030/api';

/**
 * Lightweight fetch wrapper with automatic JWT Bearer token injection
 * and 401 (unauthorized) handling.
 */
async function request(path, options = {}) {
  const token = localStorage.getItem('smartspace_token');

  const headers = {
    ...(options.headers || {}),
  };

  // Only set Content-Type for JSON bodies (not FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 — clear credentials and redirect to login
  if (response.status === 401) {
    localStorage.removeItem('smartspace_token');
    localStorage.removeItem('smartspace_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  return response;
}

const api = {
  get: (path) => request(path, { method: 'GET' }),

  post: (path, body) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),

  put: (path, body) =>
    request(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (path) => request(path, { method: 'DELETE' }),
};

export default api;
