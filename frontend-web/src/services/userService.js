const API_BASE_URL = 'http://localhost:5030/api';

/**
 * Helper to retrieve stored auth token from local storage.
 */
function getAuthToken() {
  return localStorage.getItem('smartspace_token') || localStorage.getItem('token');
}

/**
 * Service to manage users and role assignments.
 */
export const userService = {
  /**
   * Fetch users with optional search query (filters FullName and Email).
   * @param {string} searchQuery
   */
  async fetchUsers(searchQuery = '') {
    const token = getAuthToken();
    const url = new URL(`${API_BASE_URL}/users`);
    if (searchQuery && searchQuery.trim() !== '') {
      url.searchParams.append('search', searchQuery.trim());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch users (status: ${response.status})`);
    }

    return await response.json();
  },

  /**
   * Update the role of a user.
   * @param {string} id - User Guid
   * @param {string} newRole - Target role string
   */
  async updateUserRole(id, newRole) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ newRole }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update user role (status: ${response.status})`);
    }

    return await response.json();
  },
};

export default userService;
