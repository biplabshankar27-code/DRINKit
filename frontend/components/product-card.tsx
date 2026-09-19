'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, apiMessage } from '@/lib/api';
import { useToast } from '@/components/toast';
import { PriceDisplay } from '@/components/price-display';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import type { CartTotals, Product } from '@/lib/types';

const chipClass = (category: string): string => {
  const cat = category.toLowerCase();
  if (cat === 'whisky' || cat === 'rum') return 'chip chip-oak';
  if (cat === 'wine') return 'chip chip-berry';
  return 'chip';
};

export function ProductCard({ product, onAdd }: { product: Product; onAdd?: (line: { productId: string }) => void }) {
  const token = useAuthStore((s) => s.token);
  const setCart = useCartStore((s) => s.setCart);
  const wishlisted = useWishlistStore((s) => s.productIds.includes(product._id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;

  const onWishlistToggle = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    await toggleWishlist(product._id);
    toast(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist', 'success');
  };

  const addToCart = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post<CartTotals>('/cart/items', { productId: product._id, quantity: 1 });
      setCart(data);
      toast('Added to cart', 'success');
      onAdd?.({ productId: product._id });
    } catch (e) {
      toast(apiMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card card-hover group relative flex flex-col overflow-hidden">
      <Link href={`/product/${product._id}`} className="relative block aspect-[3/4] overflow-hidden" style={{ background: 'var(--elevated)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          loading="lazy"
        />
        {outOfStock && (
          <span
            className="absolute inset-x-0 top-1/2 mx-auto w-max -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
            style={{ background: 'color-mix(in srgb, var(--surface) 88%, transparent)', color: 'var(--danger)' }}
          >
            Out of stock
          </span>
        )}
        {lowStock && (
          <span
            className="absolute left-3 top-3 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            Only {product.stock} left
          </span>
        )}
        <button
          onClick={onWishlistToggle}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-base transition"
          style={{
            background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
            color: wishlisted ? 'var(--danger)' : 'var(--text-2)',
            boxShadow: 'var(--shadow-1)',
          }}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </Link>

      {/* WHY YOU MIGHT LIKE IT hover panel (desktop, non-touch) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-3 bottom-[8.5rem] hidden translate-y-3 opacity-0 transition-all duration-200 md:group-hover:translate-y-0 md:group-hover:opacity-100 lg:block"
      >
        <div
          className="rounded-xl p-3 text-xs leading-relaxed"
          style={{ background: 'color-mix(in srgb, var(--elevated) 92%, transparent)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)' }}
        >
          <div className="eyebrow mb-1" style={{ fontSize: '0.62rem' }}>
            Why you might like it
          </div>
          <p className="line-clamp-2" style={{ color: 'var(--text-2)' }}>
            {product.tastingNotes?.split(/(?<=[.!?])\s/)[0]}
          </p>
          {[...product.occasionTags, ...product.foodPairings].length > 0 && (
            <p className="mt-1.5 line-clamp-1" style={{ color: 'var(--text-3)' }}>
              Perfect for: {[...product.occasionTags, ...product.foodPairings].slice(0, 4).join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          {product.subCategory} · {product.brand}
        </div>
        <Link
          href={`/product/${product._id}`}
          className="font-display line-clamp-2 text-[15px] font-semibold leading-snug transition-colors hover:opacity-80"
          style={{ color: 'var(--text)' }}
        >
          {product.name}
        </Link>
        <div className="flex flex-wrap gap-1">
          {product.flavorTags.slice(0, 3).map((t) => (
            <span key={t} className={chipClass(product.category)}>
              {t}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div>
            <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
            <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
              {product.volumeMl}ml · {product.abv}% ABV
            </div>
          </div>
          <button
            onClick={addToCart}
            disabled={busy || outOfStock}
            aria-label={`Add ${product.name} to cart`}
            className="btn btn-primary btn-sm shrink-0"
          >
            {busy ? '…' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
