'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens } from '@/lib/types';

interface AuthState {
  token: string | null;
  user: AuthTokens['user'] | null;
  setAuth: (t: AuthTokens) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: ({ accessToken, user }: AuthTokens) => set({ token: accessToken, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'drinkit-auth' },
  ),
);
