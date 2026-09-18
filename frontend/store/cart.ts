'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartTotals } from '@/lib/types';

interface CartState {
  cart: CartTotals | null;
  setCart: (c: CartTotals) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: null,
      setCart: (cart) => set({ cart }),
    }),
    { name: 'drinkit-cart' },
  ),
);
