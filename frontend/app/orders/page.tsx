'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api, apiMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const STATUS_STEPS = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
const API_WS = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

export default function OrdersPage() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return; }
    api.get('/orders')
      .then(({ data }) => setOrders(data))
      .catch((e) => setError(apiMessage(e)))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !userId || typeof window === 'undefined') return;
    const socket = io(`${API_WS}/tracking`, { auth: { userId }, transports: ['websocket'] });
    socket.on('order:status', ({ orderId, status }: { orderId: string; status: string }) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    });
    return () => { socket.disconnect(); };
  }, [token, userId]);

  if (loading) return <div className="skeleton h-64 w-full" />;
  if (orders.length === 0) {
    return <p className="py-20 text-center text-neutral-500">No orders yet — the sommelier is waiting for you.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Orders</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {orders.map((o) => {
        const step = STATUS_STEPS.indexOf(o.status) + 1;
        return (
          <div key={o.id} className="card space-y-3 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono text-neutral-400">#{o.id.slice(0, 8)}</span>
              <span className="font-semibold capitalize text-amber-200">{o.status.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex gap-1">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-amber-300' : 'bg-white/10'}`} title={s} />
              ))}
            </div>
            <div className="space-y-1 text-sm text-neutral-300">
              {o.items.map((it: any) => (
                <div key={it.productId} className="flex justify-between">
                  <span>{it.quantity}× {it.name}</span>
                  <span>₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
              <span className="text-neutral-400">
                {new Date(o.createdAt).toLocaleString()}
                {o.etaMinutes ? ` · ETA ${o.etaMinutes}m` : ''}
              </span>
              <span className="font-bold">₹{o.grandTotal}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
