'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, apiMessage } from '@/lib/api';
import type { CartTotals } from '@/lib/types';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { SectionHeader, EmptyState } from '@/components/section-header';
import { QuantitySelector } from '@/components/quantity-selector';
import { useToast } from '@/components/toast';

export default function CartPage() {
  const token = useAuthStore((s) => s.token);
  const cart = useCartStore((s) => s.cart);
  const setCart = useCartStore((s) => s.setCart);
  const { toast } = useToast();
  const [loading, setLoading] = useState(!cart);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    if (!cart) {
      api
        .get<CartTotals>('/cart')
        .then(({ data }) => setCart(data))
        .catch((e) => toast(apiMessage(e), 'error'))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const update = async (productId: string, quantity: number, name: string) => {
    if (busyId === productId) return;
    setBusyId(productId);
    const prev = cart;
    try {
      const { data } = await api.patch<CartTotals>('/cart/items', { productId, quantity });
      setCart(data);
      if (quantity === 0) toast(`Removed ${name} from cart`, 'info');
    } catch (e) {
      if (prev) setCart(prev);
      toast(apiMessage(e), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const clear = async () => {
    const prev = cart;
    try {
      const { data } = await api.delete<CartTotals>('/cart/items');
      setCart(data);
    } catch (e) {
      if (prev) setCart(prev);
      toast(apiMessage(e), 'error');
    }
  };

  if (loading) return <div className="skeleton my-10 h-64 w-full" />;

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is waiting for something good."
        message="Browse the drinks and add a pour you'll enjoy."
        ctaHref="/shop"
        ctaLabel="Start Shopping"
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex items-end justify-between gap-3">
          <SectionHeader title="Your cart" />
          <button
            type="button"
            onClick={() => void clear()}
            disabled={busyId !== null}
            className="btn btn-quiet btn-sm"
          >
            Clear cart
          </button>
        </div>
        <div className="space-y-3">
          {cart.items.map((line) => (
            <div key={line.productId} className="card flex items-center gap-4 p-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-[0.5rem]" style={{ background: 'var(--elevated)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={line.image} alt={line.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${line.productId}`}
                  className="font-display block text-[15px] font-semibold leading-snug transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text)' }}
                >
                  {line.name}
                </Link>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
                  {line.category} · ₹{line.price}
                </p>
              </div>
              <QuantitySelector
                value={line.quantity}
                max={line.stock}
                onChange={(q) => void update(line.productId, q, line.name)}
              />
              <div className="w-16 text-right text-sm font-bold" style={{ color: 'var(--text)' }}>
                ₹{line.price * line.quantity}
              </div>
              <button
                type="button"
                aria-label={`Remove ${line.name}`}
                disabled={busyId === line.productId}
                onClick={() => void update(line.productId, 0, line.name)}
                className="btn btn-quiet btn-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <aside>
        <div className="sticky top-6 space-y-4">
          <div className="surface-muted space-y-2 p-5 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Items</span>
              <span>₹{cart.itemsTotal}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Delivery</span>
              <span>{cart.deliveryFee === 0 ? 'Free' : `₹${cart.deliveryFee}`}</span>
            </div>
            <div className="divider my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Grand total</span>
              <span>₹{cart.grandTotal}</span>
            </div>
          </div>
          <Link href="/checkout" className="btn btn-primary btn-lg w-full">
            Proceed to checkout · ₹{cart.grandTotal}
          </Link>
        </div>
      </aside>
    </div>
  );
}
