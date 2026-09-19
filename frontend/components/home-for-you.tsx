'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { SectionHeader, EmptyState } from '@/components/section-header';
import { ProductGrid } from '@/components/product-grid';
import { Reveal } from '@/components/home-reveal';
import type { Product } from '@/lib/types';

interface ForYouState {
  products: Product[];
  loading: boolean;
  personalized: boolean;
  error: boolean;
}

const INITIAL: ForYouState = { products: [], loading: true, personalized: false, error: false };

export function HomeForYou() {
  const token = useAuthStore((s) => s.token);
  const [state, setState] = useState<ForYouState>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    const finish = (patch: Partial<ForYouState>) => {
      if (!cancelled) setState((prev) => ({ ...prev, ...patch, loading: false }));
    };

    const loadForYou = () => {
      setState((prev) => ({ ...prev, personalized: true, loading: true, error: false }));
      api
        .get<Product[]>('/recommendations/for-you', { params: { limit: 8 } })
        .then(({ data }) => finish({ products: data ?? [], personalized: true }))
        .catch(() => {
          api
            .get<Product[]>('/recommendations/popular', { params: { limit: 8 } })
            .then(({ data }) => finish({ products: data ?? [], personalized: false }))
            .catch(() => finish({ products: [], personalized: false, error: true }));
        });
    };

    const loadPopular = () => {
      setState({ products: [], loading: true, personalized: false, error: false });
      api
        .get<Product[]>('/recommendations/popular', { params: { limit: 8 } })
        .then(({ data }) => finish({ products: data ?? [], personalized: false }))
        .catch(() => finish({ products: [], personalized: false, error: true }));
    };

    if (token) loadForYou();
    else loadPopular();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Reveal>
      <section>
        <SectionHeader
          eyebrow="CURATED"
          title={state.personalized ? 'FOR YOU' : 'POPULAR RIGHT NOW'}
          subtitle={state.personalized ? 'Picked from your taste and recent pours.' : 'What everyone is pouring this week.'}
        />
        {state.error ? (
          <EmptyState title="Something went wrong" message="We couldn't load recommendations." ctaHref="/shop" ctaLabel="Browse the shop" />
        ) : (
          <ProductGrid products={state.products} loading={state.loading} skeletonCount={8} />
        )}
      </section>
    </Reveal>
  );
}
