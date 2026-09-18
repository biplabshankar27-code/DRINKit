'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiMessage } from '@/lib/api';
import type { Address, Order } from '@/lib/types';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

const emptyAddress = { label: '', line1: '', line2: '', city: '', state: '', postalCode: '', isDefault: true };

export default function CheckoutPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const cart = useCartStore((s) => s.cart);
  const setCart = useCartStore((s) => s.setCart);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState<typeof emptyAddress>(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return; }
    Promise.all([api.get('/users/me/addresses'), api.get('/cart')])
      .then(([a, c]) => {
        const list = a.data as Address[];
        setAddresses(list);
        const def = list.find((x) => x.isDefault) ?? list[0];
        if (def) setSelected(def.id); else setShowForm(true);
        setCart(c.data);
      })
      .catch((e) => setError(apiMessage(e)));
  }, [token, setCart]);

  const addAddress = async () => {
    setBusy(true);
    try {
      const { data } = await api.post<Address>('/users/me/addresses', form);
      setAddresses((prev) => [...prev, data]);
      setSelected(data.id);
      setShowForm(false);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const placeOrder = async () => {
    if (!cart) return;
    setBusy(true);
    setError('');
    try {
      const order = await api.post<Order>('/orders', { addressId: selected });
      await api.post('/payments/verify', {
        orderId: order.data.id,
        reference: `mock_${order.data.id}`,
        success: true,
      });
      await api.get('/cart').then((r) => setCart(r.data));
      router.push(`/orders?placed=${order.data.id}`);
    } catch (e) {
      setError(apiMessage(e));
      setBusy(false);
    }
  };

  if (!cart) return <div className="skeleton h-64 w-full" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Checkout</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="card space-y-3 p-6">
        <h2 className="font-bold">Delivery address</h2>
        {addresses.map((a) => (
          <label key={a.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${selected === a.id ? 'border-amber-200/60' : 'border-white/10'}`}>
            <input type="radio" checked={selected === a.id} onChange={() => setSelected(a.id)} />
            <div>
              <p className="font-semibold">{a.label} · {a.postalCode}</p>
              <p className="text-neutral-400">{a.line1}, {a.city}, {a.state}</p>
            </div>
          </label>
        ))}
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-ghost h-9 px-4 text-sm">+ New address</button>
        )}
        {showForm && (
          <div className="grid gap-2 sm:grid-cols-2">
            <input placeholder="Label (Home/Office)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input" />
            <input placeholder="House / Street" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="input" />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
            <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input" />
            <input placeholder="PIN" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="input" />
            <button onClick={addAddress} disabled={busy} className="btn btn-ghost h-9">Save address</button>
          </div>
        )}
      </section>

      <section className="card space-y-2 p-6 text-sm">
        <div className="flex justify-between"><span className="text-neutral-400">Items</span><span>₹{cart.itemsTotal}</span></div>
        <div className="flex justify-between"><span className="text-neutral-400">Delivery</span><span>{cart.deliveryFee ? `₹${cart.deliveryFee}` : 'Free'}</span></div>
        <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold"><span>Total</span><span>₹{cart.grandTotal}</span></div>
        <button onClick={placeOrder} disabled={busy || !selected} className="btn btn-accent mt-2 h-10 w-full disabled:opacity-50">
          {busy ? 'Placing order…' : 'Pay & place order (mock)'}
        </button>
        <p className="text-xs text-neutral-500">MVP uses a mock payment gateway; plug Razorpay keys into the backend to enable the real flow.</p>
      </section>
    </div>
  );
}
