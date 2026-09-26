import { create } from 'zustand';
import { api } from '../lib/api';

/**
 * Global auth store using Zustand.
 * Manages user state, login/register flows, and token persistence.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('brilliance_token') || null,
  loading: true,
  error: null,

  /** Attempt to hydrate session from stored JWT */
  hydrate: async () => {
    const token = localStorage.getItem('brilliance_token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const user = await api.getMe();
      set({ user, token, loading: false });
    } catch {
      localStorage.removeItem('brilliance_token');
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (username, password) => {
    set({ error: null });
    try {
      const data = await api.login(username, password);
      localStorage.setItem('brilliance_token', data.token);
      set({ user: data.user, token: data.token, error: null });
      return data.user;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  register: async ({ username, email, password, displayName }) => {
    set({ error: null });
    try {
      const data = await api.register({ username, email, password, displayName });
      localStorage.setItem('brilliance_token', data.token);
      set({ user: data.user, token: data.token, error: null });
      return data.user;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('brilliance_token');
    set({ user: null, token: null });
  },

  /** Refresh user profile from server */
  refreshUser: async () => {
    try {
      const user = await api.getMe();
      set({ user });
    } catch {
      // ignore
    }
  }
}));
