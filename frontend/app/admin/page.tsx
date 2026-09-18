'use client';

import { useEffect, useState } from 'react';
import { api, apiMessage } from '@/lib/api';
import type { Order, Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth';

interface Draft {
  name: string;
  category: string;
  brand: string;
  price: number;
  abv: number;
  stock: number;
  image: string;
}

const blank: Draft = { name: '', category: 'Beer', brand: '', price: 100, abv: 5, stock: 10, image: '' };

const CATEGORIES = ['Beer', 'Wine', 'Whisky', 'Rum', 'Gin', 'Vodka', 'Tequila', 'RTD'];
const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminPage() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== 'admin') return;
    Promise.all([api.get('/catalog/products', { params: { limit: 50, sort: 'popular' } }), api.get('/orders/admin/all')])
      .then(([p, o]) => {
        setProducts(p.data.items);
        setOrders(o.data);
      })
      .catch((e) => setError(apiMessage(e)))
      .finally(() => setLoading(false));
  }, [token, role]);

  const saveStock = async (id: string, stock: number) => {
    try {
      const { data } = await api.patch(`/catalog/admin/products/${id}/stock`, { stock });
      setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, stock: data.stock } : p)));
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  const createProduct = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post<Product>('/catalog/admin/products', {
        ...draft,
        image: draft.image || `https://placehold.co/600x800/1a1a1e/f5d892?text=${encodeURIComponent(draft.name)}`,
        description: 'Custom catalog entry added via admin dashboard.',
        tastingNotes: 'Tasting notes pending.',
        flavorTags: [],
        subCategory: 'Custom',
        origin: 'India',
        volumeMl: 750,
        isActive: true,
      });
      setProducts((prev) => [data, ...prev]);
      setDraft(blank);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const setOrderStatus = async (id: string, status: string) => {
    try {
      const { data } = await api.patch<Order>(`/orders/admin/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: data.status, etaMinutes: data.etaMinutes } : o)));
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  if (!token || role !== 'admin') {
    return (
      <p className="py-20 text-center text-neutral-500">
        Admin access only — log in as <span className="text-amber-200">admin@drinkit.dev</span>.
      </p>
    );
  }

  const delivered = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Admin dashboard</h1>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="card px-4 py-2"><b className="text-amber-200">{products.length}</b><p className="text-neutral-400">products</p></div>
          <div className="card px-4 py-2"><b className="text-amber-200">{orders.length}</b><p className="text-neutral-400">orders</p></div>
          <div className="card px-4 py-2"><b className="text-amber-200">{delivered}</b><p className="text-neutral-400">delivered</p></div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['products', 'orders'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`btn h-9 px-5 text-sm capitalize ${tab === t ? 'btn-accent' : 'btn-ghost'}`}>
            {t}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {tab === 'products' && (
        <div className="space-y-4">
          <div className="card grid gap-2 p-4 sm:grid-cols-4">
            <input placeholder="Product name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" />
            <input placeholder="Brand" value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} className="input" />
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="input">
              {CATEGORIES.map((c) => <option key={c} className="bg-neutral-900">{c}</option>)}
            </select>
            <input type="number" placeholder="Price ₹" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} className="input" />
            <input type="number" placeholder="ABV %" value={draft.abv} onChange={(e) => setDraft({ ...draft, abv: Number(e.target.value) })} className="input" />
            <input type="number" placeholder="Stock" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} className="input" />
            <button onClick={createProduct} disabled={busy || !draft.name || !draft.brand} className="btn btn-accent h-9 sm:col-span-3 disabled:opacity-40">
              Add product
            </button>
          </div>
          <div className="card divide-y divide-white/5">
            {products.map((p) => (
              <div key={p._id} className="flex items-center gap-3 p-3 text-sm">
                <span className="flex-1 truncate">{p.name}</span>
                <span className="chip hidden sm:inline">{p.category}</span>
                <span className="w-16 text-right text-neutral-400">₹{p.price}</span>
                <span className="w-16 rounded-md border border-white/10 px-2 py-1 text-center">
                  {p.stock}
                </span>
                <button
                  onClick={() => saveStock(p._id, p.stock + 1)}
                  className="btn btn-ghost h-7 px-2 text-xs"
                >
                  +1
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-neutral-500">No orders yet.</p>}
          {orders.map((o) => (
            <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-mono text-neutral-400">#{o.id.slice(0, 8)} · {new Date(o.createdAt).toLocaleDateString()}</p>
                <p className="mt-1 text-neutral-300">{o.items?.map((it: { quantity: number; name: string }) => `${it.quantity}× ${it.name}`).join(', ')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">₹{o.grandTotal}</span>
                <select
                  value={o.status}
                  onChange={(e) => setOrderStatus(o.id, e.target.value)}
                  className="input w-40"
                >
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <option key={s} className="bg-neutral-900">{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

;
