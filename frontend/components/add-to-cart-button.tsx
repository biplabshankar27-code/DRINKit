'use client';

import { useState } from 'react';
import { api, apiMessage } from '@/lib/api';
import { useToast } from '@/components/toast';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import type { CartTotals } from '@/lib/types';

export function AddToCartButton({
  productId,
  name,
  quantity = 1,
  disabled = false,
}: {
  productId: string;
  name: string;
  quantity?: number;
  disabled?: boolean;
}) {
  const token = useAuthStore((s) => s.token);
  const setCart = useCartStore((s) => s.setCart);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post<CartTotals>('/cart/items', { productId, quantity });
      setCart(data);
      toast(`Added ${name} to cart`, 'success');
    } catch (e) {
      toast(apiMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={add} disabled={busy || disabled} className="btn btn-primary btn-md flex-1">
      {busy ? 'Adding…' : 'Add to cart'}
    </button>
  );
}
