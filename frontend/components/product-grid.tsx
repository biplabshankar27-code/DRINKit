'use client';

import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/types';

function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="skeleton aspect-[3/4] rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="mt-2 flex items-center justify-between">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
}: {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => <ProductCardSkeleton key={`skeleton-${i}`} />)
        : products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}
