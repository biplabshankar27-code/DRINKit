'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/catalog/products', { params: { limit: 12, sort: 'popular' } })
      .then(({ data }) => setProducts(data.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden p-10">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <h1 className="text-3xl font-black sm:text-5xl">
          Liquor, delivered. <span className="text-amber-200">Paired by AI.</span>
        </h1>
        <p className="mt-3 max-w-xl text-neutral-400">
          Browse the catalog, get sommelier-grade recommendations, and track your delivery live. Ask the
          AI sommelier anything — from peated malts to mocktail-worthy pairings.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Popular right now</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-80" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
