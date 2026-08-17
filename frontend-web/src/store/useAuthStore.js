import { create } from 'zustand';

const API_URL = 'http://localhost:5030/api/auth';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('smartspace_user')) || null,
  token: localStorage.getItem('smartspace_token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      const { token, id, email: userEmail, fullName, role } = data;
      const user = { id, email: userEmail, fullName, role };

      localStorage.setItem('smartspace_token', token);
      localStorage.setItem('smartspace_user', JSON.stringify(user));

      set({ token, user, isLoading: false, error: null });
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  register: async (email, password, fullName, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      const { token, id, email: userEmail, fullName: userFullName, role: userRole } = data;
      const user = { id, email: userEmail, fullName: userFullName, role: userRole };

      localStorage.setItem('smartspace_token', token);
      localStorage.setItem('smartspace_user', JSON.stringify(user));

      set({ token, user, isLoading: false, error: null });
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('smartspace_token');
    localStorage.removeItem('smartspace_user');
    set({ token: null, user: null, error: null });
  },

  fetchProfile: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const profile = await response.json();
        const updatedUser = {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          role: profile.role
        };
        localStorage.setItem('smartspace_user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      } else if (response.status === 401) {
        get().logout();
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  }
}));
