'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiMessage } from '@/lib/api';
import type { Address, Order } from '@/lib/types';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { SectionHeader } from '@/components/section-header';
import { useToast } from '@/components/toast';

const emptyAddress = { label: '', line1: '', line2: '', city: '', state: '', postalCode: '', isDefault: true };
const addressFields: { key: keyof typeof emptyAddress; label: string; placeholder: string }[] = [
  { key: 'label', label: 'Label', placeholder: 'Home / Office' },
  { key: 'line1', label: 'House / Street', placeholder: 'Flat 3, Grand Road' },
  { key: 'line2', label: 'Area (optional)', placeholder: 'Landmark, area' },
  { key: 'city', label: 'City', placeholder: 'Mumbai' },
  { key: 'state', label: 'State', placeholder: 'Maharashtra' },
  { key: 'postalCode', label: 'PIN code', placeholder: '400001' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const cart = useCartStore((s) => s.cart);
  const setCart = useCartStore((s) => s.setCart);
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState<typeof emptyAddress>(emptyAddress);
  const [showForm, setShowForm] = useState(false);
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
      .catch((e) => toast(apiMessage(e), 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, setCart]);

  const addAddress = async () => {
    setBusy(true);
    try {
      const { data } = await api.post<Address>('/users/me/addresses', form);
      setAddresses((prev) => [...prev, data]);
      setSelected(data.id);
      setShowForm(false);
      setForm(emptyAddress);
    } catch (e) {
      toast(apiMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const placeOrder = async () => {
    setBusy(true);
    try {
      const order = await api.post<Order>('/orders', { addressId: selected });
      await api.get('/cart').then((r) => setCart(r.data));
      toast('Order confirmed', 'success');
      router.push(`/orders?placed=${order.data.id}`);
    } catch (e) {
      toast(apiMessage(e), 'error');
      setBusy(false);
    }
  };

  if (!cart) return <div className="skeleton my-10 h-64 w-full" />;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <SectionHeader eyebrow="Almost there" title="Checkout" subtitle="Confirm where your drinks are going, then place your order." />

        <div className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider">
          <span className="chip chip-accent">1 · Address</span>
          <span aria-hidden style={{ color: 'var(--text-3)' }}>→</span>
          <span className={selected ? 'chip chip-accent' : 'chip'}>2 · Review</span>
        </div>

        <section className="card space-y-3 p-6">
          <h2 className="eyebrow">Delivery address</h2>
          {addresses.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer items-start gap-3 rounded-[0.75rem] border p-3 text-sm transition-colors"
              style={{ borderColor: selected === a.id ? 'var(--accent)' : 'var(--border)', background: selected === a.id ? 'var(--accent-soft)' : 'transparent' }}
            >
              <input
                type="radio"
                name="delivery-address"
                checked={selected === a.id}
                onChange={() => setSelected(a.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold" style={{ color: 'var(--text)' }}>
                  {a.label} · {a.postalCode}
                </span>
                <span className="mt-0.5 block" style={{ color: 'var(--text-2)' }}>
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state}
                </span>
              </span>
            </label>
          ))}
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn btn-ghost btn-sm">+ Add a new address</button>
          )}
          {showForm && (
            <form
              onSubmit={(e) => { e.preventDefault(); void addAddress(); }}
              className="grid gap-3 sm:grid-cols-2"
            >
              {addressFields.map((f) => (
                <div key={f.key} className={f.key === 'line1' ? 'sm:col-span-2' : ''}>
                  <label htmlFor={`addr-${f.key}`} className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                    {f.label}
                  </label>
                  <input
                    id={`addr-${f.key}`}
                    value={form[f.key] as string}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="input"
                  />
                </div>
              ))}
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={busy} className="btn btn-primary btn-sm">Save address</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-quiet btn-sm">Cancel</button>
              </div>
            </form>
          )}
        </section>
      </div>

      <aside>
        <div className="sticky top-6 card space-y-4 p-6">
          <h2 className="eyebrow">Review order</h2>
          <div className="space-y-2 text-sm">
            {cart.items.map((it) => (
              <div key={it.productId} className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate">
                  {it.quantity}× {it.name}
                </span>
                <span style={{ color: 'var(--text-2)' }}>₹{it.price * it.quantity}</span>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Subtotal</span>
              <span>₹{cart.itemsTotal}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Delivery</span>
              <span>{cart.deliveryFee ? `₹${cart.deliveryFee}` : 'Free'}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>₹{cart.grandTotal}</span>
            </div>
          </div>
          <button
            onClick={() => void placeOrder()}
            disabled={busy || !selected}
            className="btn btn-primary btn-lg w-full"
          >
            {busy ? 'Placing your order…' : 'Place order'}
          </button>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
            You can cancel pending orders from your order history.
          </p>
        </div>
      </aside>
    </div>
  );
}
