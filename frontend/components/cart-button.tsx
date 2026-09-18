'use client';

import { useState } from 'react';
import { api, apiMessage } from '@/lib/api';
import type { CartTotals, Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

export function CartButton({ product }: { product: Product }) {
  const token = useAuthStore((s) => s.token);
  const setCart = useCartStore((s) => s.setCart);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  const add = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post<CartTotals>('/cart/items', { productId: product._id, quantity: qty });
      setCart(data);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-white/10">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1.5 text-lg">−</button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button onClick={() => setQty(Math.min(20, qty + 1))} className="px-3 py-1.5 text-lg">+</button>
        </div>
        <button onClick={add} disabled={busy || product.stock <= 0} className="btn btn-accent h-10 flex-1 px-6 disabled:opacity-50">
          {product.stock <= 0 ? 'Out of stock' : added ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
