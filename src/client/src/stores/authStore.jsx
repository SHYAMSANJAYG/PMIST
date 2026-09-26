import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: true,
      error: null,

      hydrate: async () => {
        const { token } = get();
        if (token) {
          try {
            const user = await api.getMe();
            set({ user, loading: false });
          } catch {
            set({ user: null, token: null, loading: false });
          }
        } else {
          set({ loading: false });
        }
      },

      login: async (username, password) => {
        set({ error: null });
        try {
          const data = await api.login(username, password);
          set({ user: data.user, token: data.token });
          return data.user;
        } catch (err) {
          set({ error: err.message });
          throw err;
        }
      },

      register: async (form) => {
        set({ error: null });
        try {
          const data = await api.register(form);
          set({ user: data.user, token: data.token });
        } catch (err) {
          set({ error: err.message });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
      },

      refreshUser: async () => {
        try {
          const user = await api.getMe();
          set({ user });
        } catch (err) {
          console.error('Failed to refresh user:', err);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);