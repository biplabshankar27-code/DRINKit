'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, apiMessage } from '@/lib/api';
import type { Order } from '@/lib/types';
import { useAuthStore } from '@/store/auth';
import { SectionHeader } from '@/components/section-header';
import { useToast } from '@/components/toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function OrdersView() {
  const token = useAuthStore((s) => s.token);
  const { toast } = useToast();
  const params = useSearchParams();
  const placedId = params.get('placed');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [placedTotal, setPlacedTotal] = useState<string>('');

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return; }
    api
      .get<Order[]>('/orders')
      .then(({ data }) => {
        setOrders(data);
        if (placedId) {
          const placed = data.find((o) => o.id === placedId);
          if (placed) setPlacedTotal(`₹${placed.grandTotal}`);
        }
      })
      .catch((e) => toast(apiMessage(e), 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const cancel = async (id: string) => {
    setCancelingId(id);
    try {
      const { data } = await api.post<Order>(`/orders/${id}/cancel`);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: data.status } : o)));
      toast('Order cancelled', 'info');
    } catch (e) {
      toast(apiMessage(e), 'error');
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) return <div className="skeleton my-10 h-64 w-full" />;

  const placed = placedId ? orders.find((o) => o.id === placedId) : undefined;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Your history" title="Orders" subtitle="Every pour you've ordered, all in one place." />

      {placedId && placed && (
        <div className="card p-6 text-center" style={{ background: 'var(--success-soft)', borderColor: 'var(--success)' }}>
          <p className="eyebrow" style={{ color: 'var(--success)' }}>Order confirmed</p>
          <p className="font-display mt-1 text-xl">Thank you, your order is in.</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
            Order #{placed.id.slice(0, 8)} · {placedTotal}
          </p>
        </div>
      )}

      {orders.length === 0 && !placedId && (
        <div className="card flex flex-col items-center px-8 py-16 text-center">
          <div className="font-display text-2xl" style={{ color: 'var(--accent)' }}>No orders yet.</div>
          <p className="mt-2 max-w-md text-sm" style={{ color: 'var(--text-2)' }}>
            Whenever you&apos;re ready, we&apos;d love to pour something for you.
          </p>
          <Link href="/shop" className="btn btn-primary btn-sm mt-5">Start shopping</Link>
        </div>
      )}

      {orders.map((o) => (
        <div key={o.id} className="card space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs" style={{ color: 'var(--text-2)' }}>#{o.id.slice(0, 8)}</span>
              <span style={{ color: 'var(--text-3)' }}>{formatDate(o.createdAt)}</span>
            </div>
            <span className="chip capitalize">{o.status.replace(/_/g, ' ')}</span>
          </div>
          <p className="min-w-0 truncate text-sm" style={{ color: 'var(--text-2)' }}>
            {o.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
          </p>
          <div className="divider" />
          <div className="flex items-center justify-between text-sm">
            <span />
            <span className="font-bold" style={{ color: 'var(--text)' }}>₹{o.grandTotal}</span>
          </div>
          {(o.status === 'pending' || o.status === 'confirmed') && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void cancel(o.id)}
                disabled={cancelingId === o.id}
                className="btn btn-ghost btn-sm"
              >
                {cancelingId === o.id ? 'Cancelling…' : 'Cancel order'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="skeleton my-10 h-64 w-full" />}>
      <OrdersView />
    </Suspense>
  );
}
