'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { HomeHero } from '@/components/home-hero';
import { HomeCategories } from '@/components/home-categories';
import { HomeOccasions } from '@/components/home-occasions';
import { EditorialRow } from '@/components/editorial-row';
import { HomeForYou } from '@/components/home-for-you';
import { HomeAiBartender } from '@/components/home-ai-bartender';
import { HomeTasteStrip } from '@/components/home-taste-strip';
import { EmptyState } from '@/components/section-header';

export default function HomePage() {
  // Shared pool of popular products, filtered client-side by occasionTags
  // (the catalog API has no server-side occasion filter).
  const [pool, setPool] = useState<Product[]>([]);
  const [poolLoading, setPoolLoading] = useState(true);
  const [poolError, setPoolError] = useState(false);
  const [under2000, setUnder2000] = useState<Product[]>([]);
  const [under2000Loading, setUnder2000Loading] = useState(true);
  const [beginners, setBeginners] = useState<Product[]>([]);
  const [beginnersLoading, setBeginnersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ items: Product[] }>('/catalog/products', { params: { limit: 50, sort: 'popular' } })
      .then(({ data }) => {
        if (!cancelled) setPool(data?.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setPoolError(true);
      })
      .finally(() => {
        if (!cancelled) setPoolLoading(false);
      });

    api
      .get<{ items: Product[] }>('/catalog/products', { params: { limit: 8, sort: 'popular', maxPrice: 2000 } })
      .then(({ data }) => {
        if (!cancelled) setUnder2000(data?.items ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setUnder2000Loading(false);
      });

    api
      .get<{ items: Product[] }>('/catalog/products', { params: { limit: 8, sort: 'popular', abvMax: 15 } })
      .then(({ data }) => {
        if (!cancelled) setBeginners(data?.items ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setBeginnersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const byOccasion = (occasion: string) =>
    pool.filter((p) => (p.occasionTags ?? []).includes(occasion)).slice(0, 8);
  const weekend = byOccasion('Weekend');
  const dinner = [...pool.filter((p) => (p.occasionTags ?? []).includes('Dinner'))]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  return (
    <div className="space-y-14 md:space-y-20">
      <HomeHero />

      <HomeCategories />

      <HomeOccasions />

      <div className="space-y-14">
        <EditorialRow
          eyebrow="THE DRINKIT EDIT"
          title="THE WEEKEND EDIT"
          subtitle="Bottles chosen for slow evenings and easy company."
          products={weekend}
          loading={poolLoading}
          ctaHref={`/shop?occasion=${encodeURIComponent('Weekend')}`}
          hideWhenEmpty
        />

        <EditorialRow
          eyebrow="BUDGET PICKS"
          title="THE ₹2,000 EDIT"
          subtitle="Great picks without going over budget."
          products={under2000}
          loading={under2000Loading}
          ctaHref="/shop?maxPrice=2000&sort=popular"
          hideWhenEmpty
        />

        <EditorialRow
          eyebrow="START HERE"
          title="THE BEGINNER'S EDIT"
          subtitle="Approachable, easy-drinking bottles to start exploring."
          products={beginners}
          loading={beginnersLoading}
          ctaHref="/shop?abvMax=15&sort=popular"
          hideWhenEmpty
        />

        <EditorialRow
          eyebrow="AT THE TABLE"
          title="THE DINNER EDIT"
          subtitle="Drinks that work beautifully with food."
          products={dinner}
          loading={poolLoading}
          ctaHref={`/shop?occasion=${encodeURIComponent('Dinner')}&sort=rating`}
          hideWhenEmpty
        />

        {poolError && !poolLoading && (
          <EmptyState title="Something went wrong" message="We couldn't load the shelves right now." ctaHref="/shop" ctaLabel="Browse the shop" />
        )}

        {!poolError && !poolLoading && weekend.length === 0 && dinner.length === 0 && under2000.length === 0 && beginners.length === 0 && (
          <EmptyState title="Something went wrong" message="No edits available right now." ctaHref="/shop" ctaLabel="Browse the shop" />
        )}
      </div>

      <HomeForYou />

      <HomeAiBartender />

      <HomeTasteStrip />
    </div>
  );
}
