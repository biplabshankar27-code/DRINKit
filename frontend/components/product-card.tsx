'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, apiMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import type { CartTotals, Product } from '@/lib/types';

export function ProductCard({ product, onAdd }: { product: Product; onAdd?: (line: { productId: string }) => void }) {
  const token = useAuthStore((s) => s.token);
  const cart = useCartStore((s) => s.cart);
  const setCart = useCartStore((s) => s.setCart);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const outOfStock = product.stock <= 0;

  const addToCart = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post<CartTotals>('/cart/items', { productId: product._id, quantity: 1 });
      setCart(data);
      onAdd?.({ productId: product._id });
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card flex flex-col overflow-hidden">
      <Link href={`/product/${product._id}`} className="relative block aspect-3/4 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition hover:scale-105" />
        {outOfStock && (
          <span className="absolute top-3 left-3 rounded-full bg-black/80 px-2 py-1 text-xs font-semibold text-red-300">
            Out of stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>{product.category} · {product.volumeMl}ml · {product.abv}%</span>
          <span className="text-amber-200">★ {product.rating.toFixed(1)}</span>
        </div>
        <Link href={`/product/${product._id}`} className="line-clamp-2 font-semibold leading-snug hover:text-amber-200">
          {product.name}
        </Link>
        <div className="flex flex-wrap gap-1">
          {product.flavorTags.slice(0, 3).map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <div className="font-bold">₹{product.price}</div>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <div className="text-xs text-neutral-500 line-through">₹{product.compareAtPrice}</div>
            )}
          </div>
          <button
            onClick={addToCart}
            disabled={busy || outOfStock}
            className="btn btn-accent h-8 px-4 text-xs disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
