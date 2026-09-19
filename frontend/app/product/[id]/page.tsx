'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, apiMessage } from '@/lib/api';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { SectionHeader } from '@/components/section-header';
import { FlavorMeter } from '@/components/flavor-meter';
import { PriceDisplay } from '@/components/price-display';
import { QuantitySelector } from '@/components/quantity-selector';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { AiAskProductPanel } from '@/components/ai-ask-product-panel';
import { useAuthStore } from '@/store/auth';
import { useWishlistStore } from '@/store/wishlist';
import { useToast } from '@/components/toast';

const SWEETNESS_MAP: Record<string, number> = { low: 2, medium: 6, high: 9 };
const BODY_MAP: Record<string, number> = { light: 3, medium: 6, full: 8 };

function flavorProfile(p: Product) {
  const tags = (p.flavorTags ?? []).map((t) => t.toLowerCase());
  return {
    smoothness: 7 - (p.abv > 40 ? 2 : 0),
    sweetness: SWEETNESS_MAP[p.sweetness ?? ''] ?? (tags.includes('vanilla') || tags.includes('caramel') ? 5 : 3),
    body: BODY_MAP[p.body ?? ''] ?? 4,
    oak: tags.some((t) => t.includes('oak') || t.includes('wood')) ? 7 : 2,
    smoke: tags.some((t) => t.includes('smok') || t.includes('pepper')) ? 7 : 1,
  };
}

function WishlistHeart({ productId }: { productId: string }) {
  const token = useAuthStore((s) => s.token);
  const wishlisted = useWishlistStore((s) => s.productIds.includes(productId));
  const toggle = useWishlistStore((s) => s.toggle);
  const { toast } = useToast();

  const onToggle = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const wasWishlisted = wishlisted;
    await toggle(productId);
    toast(wasWishlisted ? 'Removed from wishlist' : 'Saved to wishlist', 'success');
  };

  return (
    <button
      onClick={onToggle}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={wishlisted}
      className="btn btn-ghost h-10 w-10 text-base"
      style={{ color: wishlisted ? 'var(--danger)' : 'var(--text-2)' }}
    >
      {wishlisted ? '♥' : '♡'}
    </button>
  );
}

function CompleteYourNight({ productId }: { productId: string }) {
  const token = useAuthStore((s) => s.token);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!productId) return;
    api
      .get<Product[]>(`/recommendations/similar/${productId}`)
      .then(({ data }) => setSimilar(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => undefined);
  }, [productId]);

  const addAll = async () => {
    setBusy(true);
    try {
      for (const p of similar) {
        await api.post('/cart/items', { productId: p._id, quantity: 1 });
      }
    } finally {
      setBusy(false);
    }
  };

  if (similar.length < 3) return null;

  return (
    <section>
      <SectionHeader eyebrow="Round it off" title="Complete your night" ctaHref="/cart" ctaLabel="View cart" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {similar.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <button onClick={addAll} disabled={busy} className="btn btn-primary btn-md">
          {busy ? 'Adding…' : `Add all to cart`}
        </button>
      </div>
    </section>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<Product>(`/catalog/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((e) => setError(apiMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-2" aria-busy="true" aria-label="Loading product">
        <div className="skeleton aspect-[4/5] w-full rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-10 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-24 w-full" />
          <div className="flex gap-3">
            <div className="skeleton h-10 w-40" />
            <div className="skeleton h-10 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) return <p className="py-20 text-center text-sm" style={{ color: 'var(--danger)' }}>{error || 'Product not found'}</p>;

  const outOfStock = product.stock <= 0;

  return (
    <div className="space-y-12">
      <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
        {/* Left sticky image */}
        <div className="md:sticky md:top-24 self-start">
          <div className="card overflow-hidden">
            <div className="relative aspect-[4/5]" style={{ background: 'var(--elevated)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              <span
                className="absolute left-4 top-4 font-display text-sm font-semibold tracking-wide"
                style={{ color: 'var(--on-accent)', textShadow: '0 1px 6px rgb(0 0 0 / 0.6)' }}
              >
                {product.brand}
              </span>
            </div>
          </div>
        </div>

        {/* Right details */}
        <div className="space-y-5">
          <div>
            <p className="eyebrow mb-1">
              {product.category} · {product.subCategory}
            </p>
            <h1 className="display-2 font-display">{product.name}</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
              {product.brand} · {product.origin}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-sm" aria-label={`Rating ${product.rating.toFixed(1)} out of 5`}>
              <span aria-hidden style={{ color: 'var(--accent)' }}>★</span>
              <span className="font-semibold">{product.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
            <span className="chip">
              {product.volumeMl} ml
            </span>
            <span className="chip">{product.abv}% ABV</span>
            {product.sweetness && <span className="chip">Sweetness: {product.sweetness}</span>}
            {product.body && <span className="chip">Body: {product.body}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <QuantitySelector value={quantity} onChange={setQuantity} max={Math.max(1, Math.min(20, product.stock))} />
            <AddToCartButton productId={product._id} name={product.name} quantity={quantity} disabled={outOfStock} />
            <button
              onClick={() => router.push('/cart')}
              disabled={outOfStock}
              className="btn btn-ghost btn-md"
            >
              Buy now
            </button>
            <WishlistHeart productId={product._id} />
          </div>
          {outOfStock && (
            <p className="text-sm" style={{ color: 'var(--danger)' }} role="status">
              Currently out of stock
            </p>
          )}

          {/* Details sections */}
          <div className="space-y-8 pt-4">
            {product.description && (
              <section>
                <SectionHeader title="Description" />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {product.description}
                </p>
              </section>
            )}
            {product.tastingNotes && (
              <section>
                <SectionHeader title="Tasting notes" />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {product.tastingNotes}
                </p>
              </section>
            )}
            {(product.servingSuggestions?.length ?? 0) > 0 && (
              <section>
                <SectionHeader title="Serving" />
                <ul className="space-y-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
                  {product.servingSuggestions!.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span aria-hidden style={{ color: 'var(--accent)' }}>›</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {(product.occasionTags?.length ?? 0) > 0 && (
              <section>
                <SectionHeader title="Occasions" />
                <div className="flex flex-wrap gap-1.5">
                  {product.occasionTags.map((t) => (
                    <Link key={t} href={`/shop?occasion=${encodeURIComponent(t)}`} className="chip chip-accent">
                      {t}
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <section>
              <SectionHeader title="Flavor profile" />
              <FlavorMeter profile={flavorProfile(product)} />
            </section>
            {(product.foodPairings?.length ?? 0) > 0 && (
              <section>
                <SectionHeader title="Pair it with" />
                <div className="flex flex-wrap gap-1.5">
                  {product.foodPairings.map((f) => (
                    <span key={f} className="chip">
                      {f}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* RECOMMENDED */}
      <CompleteYourNight productId={product._id} />

      {/* ASK YOUR AI BARTENDER */}
      <AiAskProductPanel productId={product._id} productIdTitle={product.name} />
    </div>
  );
}
