'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, apiMessage } from '@/lib/api';
import { useWishlistStore } from '@/store/wishlist';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/types';

export default function WishlistPage() {
  const productIds = useWishlistStore((s) => s.productIds);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          .catch((e) => setError(apiMessage(e)))
          .finally(() => setLoading(false));
      });
  }, [fetchWishlist]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton aspect-3/4 w-full" />
        ))}
      </div>
    );
  }

  if (error) return <p className="py-20 text-center text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Wishlist</h1>
      {products.length === 0 ? (
        <p className="py-20 text-center text-neutral-400">
          Your wishlist is empty.{' '}
          <Link href="/catalog" className="text-amber-200 hover:underline">
            Browse the catalog
          </Link>{' '}
          and tap the heart to save drinks you love.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
