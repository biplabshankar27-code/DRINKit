'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SectionHeader } from '@/components/section-header';
import { Reveal } from '@/components/home-reveal';
import type { CategoryInfo } from '@/lib/types';

// Verified static fallback per category folder under /public/images (files checked to exist).
const CATEGORY_IMAGES: Record<string, string> = {
  whisky: '/images/whisky/whisky-01.jpg',
  rum: '/images/rum/rum-01.jpg',
  vodka: '/images/vodka/vodka-01.jpg',
  gin: '/images/gin/gin-01.jpg',
  tequila: '/images/tequila/tequila-01.jpg',
  wine: '/images/wine/wine-01.jpg',
  beer: '/images/beer/beer-01.jpg',
  rtd: '/images/rtd/rtd-01.jpg',
};

export function HomeCategories() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<CategoryInfo[]>('/catalog/categories')
      .then(({ data }) => {
        if (!cancelled) setCategories(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Reveal>
      <section>
        <SectionHeader
          eyebrow="BROWSE THE SHELF"
          title="SHOP BY CATEGORY"
          subtitle="Every category on the shelf, from malts to ready-to-drink."
          ctaHref="/shop"
          ctaLabel="View all"
        />
        {error ? (
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Could not load categories right now.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card overflow-hidden">
                    <div className="skeleton aspect-[4/3] rounded-none" />
                    <div className="flex flex-col gap-2 p-4">
                      <div className="skeleton h-4 w-2/3" />
                      <div className="skeleton h-3 w-1/3" />
                    </div>
                  </div>
                ))
              : categories.slice(0, 8).map((c) => {
                  const slug = c.name.toLowerCase();
                  return (
                    <Link
                      key={c.name}
                      href={`/shop?category=${encodeURIComponent(c.name)}`}
                      className="card card-hover group flex flex-col overflow-hidden"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--elevated)' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={CATEGORY_IMAGES[slug] ?? '/images/whisky/whisky-01.jpg'}
                          alt={c.name}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex items-baseline justify-between gap-2 p-4">
                        <span className="font-display text-base font-semibold" style={{ color: 'var(--text)' }}>
                          {c.name}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {c.productCount} products
                        </span>
                      </div>
                    </Link>
                  );
                })}
          </div>
        )}
      </section>
    </Reveal>
  );
}
