import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) return false;
          const data = await res.json();
          set({ user: data.user, isAuthenticated: true });
          return true;
        } catch {
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: 'proptech-auth' }
  )
);
