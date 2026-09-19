'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiMessage } from '@/lib/api';
import { useWishlistStore } from '@/store/wishlist';
import { useAuthStore } from '@/store/auth';
import { ProductCard } from '@/components/product-card';
import { BartenderResultCard } from '@/components/bartender-result-card';
import { SectionHeader, EmptyState } from '@/components/section-header';
import { useToast } from '@/components/toast';
import type { ChatReply, Product } from '@/lib/types';

export default function WishlistPage() {
  const productIds = useWishlistStore((s) => s.productIds);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [askReply, setAskReply] = useState<ChatReply | null>(null);
  const [asking, setAsking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWishlist()
      .then(() => useWishlistStore.getState().productIds)
      .then((ids) => {
        if (ids.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }
        return api
          .get<{ items: Product[] }>('/catalog/products/by-ids', { params: { ids: ids.join(',') } })
          .then(({ data }) => setProducts(data.items))
          .catch((e) => toast(apiMessage(e), 'error'))
          .finally(() => setLoading(false));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchWishlist]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        toast('You can compare up to 4 drinks', 'info');
        return prev;
      }
      return [...prev, id];
    });
  };

  const compare = () => {
    if (selected.length < 2) {
      toast('Select at least 2 drinks to compare', 'info');
      return;
    }
    router.push(`/compare?ids=${selected.join(',')}`);
  };

  const askBartender = async () => {
    setAsking(true);
    setAskReply(null);
    try {
      const named = products
        .map((p) => p.name)
        .join('; ');
      const { data } = await api.post<ChatReply>('/assistant/chat', {
        message: `Help me choose between my saved bottles: ${named}`,
      });
      setAskReply(data);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      toast(apiMessage(e), 'error');
    } finally {
      setAsking(false);
    }
  };

  if (!token) {
    return (
      <EmptyState
        title="Sign in to see your saved drinks"
        ctaHref="/login"
        ctaLabel="Sign in"
      />
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton aspect-3/4 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Saved for later"
        title="Wishlist"
        subtitle="Saved drinks, ready whenever you are."
      />

      {products.length === 0 ? (
        <EmptyState
          title="Nothing saved yet."
          message="Browse the drinks and tap the heart to save the ones you love."
          ctaHref="/shop"
          ctaLabel="Start Shopping"
        />
      ) : (
        <>
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <button
              type="button"
              onClick={() => { setCompareMode((m) => !m); if (compareMode) setSelected([]); }}
              className={`btn btn-sm ${compareMode ? 'btn-primary' : 'btn-ghost'}`}
            >
              {compareMode ? 'Done selecting' : 'Compare saved drinks'}
            </button>
            {compareMode && (
              <>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {selected.length}/4 selected
                </span>
                <button onClick={compare} disabled={selected.length < 2} className="btn btn-primary btn-sm">
                  Compare selected
                </button>
              </>
            )}
            <div className="flex-1" />
            <button onClick={() => void askBartender()} disabled={asking} className="btn btn-ghost btn-sm">
              {asking ? 'Pouring suggestions…' : 'Ask the AI Bartender to pick one'}
            </button>
          </div>

          {askReply && (
            <div className="space-y-3" ref={endRef}>
              <div className="card px-4 py-3">
                <p className="font-display whitespace-pre-wrap text-[15px] leading-relaxed">{askReply.reply}</p>
              </div>
              {askReply.recommendations.length > 0 && (
                <div className="grid gap-3">
                  {askReply.recommendations.map((p) => (
                    <BartenderResultCard key={p._id} product={p} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p._id} className="relative">
                {compareMode && (
                  <button
                    type="button"
                    aria-label={`Select ${p.name} for comparison`}
                    onClick={() => toggleSelect(p._id)}
                    className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition"
                    style={{
                      background: selected.includes(p._id) ? 'var(--accent)' : 'color-mix(in srgb, var(--surface) 85%, transparent)',
                      color: selected.includes(p._id) ? 'var(--on-accent)' : 'var(--text-2)',
                      border: `1px solid ${selected.includes(p._id) ? 'var(--accent)' : 'var(--border-strong)'}`,
                      boxShadow: 'var(--shadow-1)',
                    }}
                  >
                    {selected.includes(p._id) ? '✓' : ''}
                  </button>
                )}
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
