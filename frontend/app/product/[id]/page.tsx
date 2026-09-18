'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, apiMessage } from '@/lib/api';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { CartButton } from '@/components/cart-button';
import { useAuthStore } from '@/store/auth';
import { useWishlistStore } from '@/store/wishlist';

function WishlistButton({ productId }: { productId: string }) {
  const token = useAuthStore((s) => s.token);
  const wishlisted = useWishlistStore((s) => s.productIds.includes(productId));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const onToggle = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    await toggleWishlist(productId);
  };

  return (
    <button
      onClick={onToggle}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`btn h-10 border border-white/10 px-4 ${
        wishlisted ? 'bg-red-500/15 text-red-300' : 'text-neutral-300'
      }`}
    >
      {wishlisted ? '♥ Wishlisted' : '♡ Wishlist'}
    </button>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/catalog/products/${id}`),
      api.get(`/recommendations/similar/${id}`).catch(() => ({ data: [] })),
    ])
      .then(([p, s]) => {
        setProduct(p.data);
        setSimilar(s.data);
      })
      .catch((e) => setError(apiMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="skeleton h-96 w-full" />;
  if (error || !product) return <p className="py-20 text-center text-red-400">{error || 'Product not found'}</p>;

  return (
    <div className="space-y-10">
      <div className="grid gap-8 md:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="aspect-3/4 w-full rounded-2xl object-cover" />
        <div className="space-y-4">
          <p className="text-sm text-neutral-400">
            {product.brand} · {product.origin} · {product.subCategory}
          </p>
          <h1 className="text-3xl font-black">{product.name}</h1>
          <p className="text-neutral-300">{product.description}</p>
          <div className="card space-y-3 p-4 text-sm">
            <p><span className="text-neutral-400">Price:</span> <span className="font-bold">₹{product.price}</span></p>
            <p><span className="text-neutral-400">ABV:</span> {product.abv}% · <span className="text-neutral-400">Volume:</span> {product.volumeMl}ml</p>
            <p><span className="text-neutral-400">Tasting notes:</span> {product.tastingNotes}</p>
            <div className="flex flex-wrap gap-1">
              {product.flavorTags.map((t) => <span key={t} className="chip">{t}</span>)}
            </div>
            {product.foodPairings.length > 0 && (
              <p><span className="text-neutral-400">Pairs with:</span> {product.foodPairings.join(', ')}</p>
            )}
            <p>
              <span className="text-neutral-400">Stock:</span>{' '}
              {product.stock > 0 ? <span className="text-emerald-400">In stock ({product.stock})</span> : <span className="text-red-400">Out of stock</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CartButton product={product} />
          </div>
          <div className="flex">
            <WishlistButton productId={product._id} />
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similar.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
