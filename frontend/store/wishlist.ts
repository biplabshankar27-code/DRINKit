'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface WishlistState {
  productIds: string[];
  hydrated: boolean;
  setProductIds: (ids: string[]) => void;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  fetchWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      hydrated: false,
      setProductIds: (productIds) => set({ productIds, hydrated: true }),
      has: (productId) => get().productIds.includes(productId),
      toggle: async (productId) => {
        const ids = get().productIds;
        const has = ids.includes(productId);
        set({ productIds: has ? ids.filter((id) => id !== productId) : [...ids, productId] });
        try {
          if (has) {
            await api.delete(`/wishlist/${productId}`);
          } else {
            await api.post(`/wishlist/${productId}`);
          }
        } catch {
          set({ productIds: ids });
        }
      },
      fetchWishlist: async () => {
        try {
          const { data } = await api.get<{ productIds: string[] }>('/wishlist');
          set({ productIds: data.productIds, hydrated: true });
        } catch {
          set({ hydrated: true });
        }
      },
    }),
    {
      name: 'drinkit-wishlist',
      partialize: (state) => ({ productIds: state.productIds }),
    },
  ),
);
