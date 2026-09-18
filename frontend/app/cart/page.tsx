'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, apiMessage } from '@/lib/api';
import type { CartTotals } from '@/lib/types';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

export default function CartPage() {
  const token = useAuthStore((s) => s.token);
  const cart = useCartStore((s) => s.cart);
  const setCart = useCartStore((s) => s.setCart);
  const [loading, setLoading] = useState(!cart);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    if (!cart) {
      api
        .get<CartTotals>('/cart')
        .then(({ data }) => setCart(data))
        .catch((e) => setError(apiMessage(e)))
        .finally(() => setLoading(false));
    }
  }, [token, cart, setCart]);

  const update = async (productId: string, quantity: number) => {
    try {
      const { data } = await api.patch<CartTotals>('/cart/items', { productId, quantity });
      setCart(data);
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  const clear = async () => {
    try {
      const { data } = await api.delete<CartTotals>('/cart/items');
      setCart(data);
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  if (loading) return <div className="skeleton h-64 w-full" />;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-semibold">Your cart is empty</p>
        <Link href="/catalog" className="btn btn-accent mt-4 h-10 px-6">Browse catalog</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Your cart</h1>
        <button onClick={clear} className="text-sm text-neutral-400 hover:text-red-400">Clear</button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-3">
        {cart.items.map((line) => (
          <div key={line.productId} className="card flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={line.image} alt={line.name} className="h-20 w-16 rounded-lg object-cover" />
            <div className="flex-1">
              <Link href={`/product/${line.productId}`} className="font-semibold hover:text-amber-200">{line.name}</Link>
              <p className="text-sm text-neutral-400">{line.category} · ₹{line.price}</p>
            </div>
            <div className="flex items-center rounded-full border border-white/10">
              <button onClick={() => update(line.productId, line.quantity - 1)} className="px-3 py-1.5">−</button>
              <span className="w-8 text-center text-sm">{line.quantity}</span>
              <button onClick={() => update(line.productId, Math.min(line.stock, line.quantity + 1))} className="px-3 py-1.5">+</button>
            </div>
            <div className="w-20 text-right font-bold">₹{line.price * line.quantity}</div>
          </div>
        ))}
      </div>
      <div className="card space-y-2 p-6 text-sm">
        <div className="flex justify-between"><span className="text-neutral-400">Items</span><span>₹{cart.itemsTotal}</span></div>
        <div className="flex justify-between"><span className="text-neutral-400">Delivery</span><span>{cart.deliveryFee === 0 ? 'Free' : `₹${cart.deliveryFee}`}</span></div>
        <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold">
          <span>Total</span><span>₹{cart.grandTotal}</span>
        </div>
        <Link href="/checkout" className="btn btn-accent mt-2 h-10 w-full">Checkout</Link>
      </div>
    </div>
  );
}
