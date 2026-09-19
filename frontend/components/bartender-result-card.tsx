'use client';

import Link from 'next/link';
import { PriceDisplay } from '@/components/price-display';
import { AddToCartButton } from '@/components/add-to-cart-button';
import type { Product } from '@/lib/types';

export function BartenderResultCard({ product, reason }: { product: Product; reason?: string }) {
  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row">
      <div
        className="h-auto w-full shrink-0 overflow-hidden rounded-[var(--radius-sm,0.5rem)] sm:w-[100px]"
        style={{ background: 'var(--elevated)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="h-full max-h-64 w-full object-cover" loading="lazy" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          {product.category} · {product.brand}
        </div>
        <Link
          href={`/product/${product._id}`}
          className="font-display mt-0.5 block text-[15px] font-semibold leading-snug transition-opacity hover:opacity-80"
          style={{ color: 'var(--text)' }}
        >
          {product.name}
        </Link>
        <div className="mt-1"><PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} /></div>
        <div className="mt-2 flex flex-wrap gap-1">
          {product.flavorTags.slice(0, 3).map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
        {reason && (
          <p className="mt-2 text-[13px] italic leading-relaxed" style={{ color: 'var(--text-2)' }}>
            <span className="eyebrow not-italic" style={{ fontSize: '0.62rem' }}>Why I&apos;d pour this: </span>
            {reason}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/product/${product._id}`} className="btn btn-ghost btn-sm">View product</Link>
          <AddToCartButton productId={product._id} name={product.name} />
        </div>
      </div>
    </div>
  );
}
