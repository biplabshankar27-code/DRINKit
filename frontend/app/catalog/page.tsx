'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';

const CATEGORIES = ['Beer', 'Wine', 'Whisky', 'Rum', 'Gin', 'Vodka', 'Tequila', 'RTD'];
const SORTS = [
  { value: 'popular', label: 'Popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'new', label: 'Newest' },
];

export default function CatalogPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [maxPrice, setMaxPrice] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sort });
    if (category) params.set('category', category);
    if (q.trim()) params.set('q', q.trim());
    if (maxPrice) params.set('maxPrice', maxPrice);
    api
      .get(`/catalog/products?${params.toString()}`)
      .then(({ data }) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [page, sort, category, q, maxPrice]);

  useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search whisky, IPA, gin..."
          className="input max-w-xs"
        />
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="input w-40">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value} className="bg-neutral-900">
              {s.label}
            </option>
          ))}
        </select>
        <input
          value={maxPrice}
          onChange={(e) => { setMaxPrice(e.target.value.replace(/\D/g, '')); setPage(1); }}
          placeholder="Max ₹"
          className="input w-24"
        />
        <button onClick={load} className="btn btn-ghost h-9 px-4 text-sm">
          Apply
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setCategory(''); setPage(1); }}
          className={`chip ${category === '' ? 'border-amber-200 text-amber-200' : ''}`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => { setCategory(category === c ? '' : c); setPage(1); }}
            className={`chip cursor-pointer ${category === c ? 'border-amber-200 text-amber-200' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-sm text-neutral-500">{total} products</p>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-80" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-20 text-center text-neutral-500">No products match your filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {total > items.length && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-ghost h-9 px-4 text-sm disabled:opacity-40">
            Prev
          </button>
          <span className="px-3 py-2 text-sm text-neutral-400">Page {page}</span>
          <button onClick={() => setPage(page + 1)} className="btn btn-ghost h-9 px-4 text-sm">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
