'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { CategoryInfo, Product } from '@/lib/types';
import { ProductGrid } from '@/components/product-grid';
import { EmptyState } from '@/components/section-header';
import { FilterSidebar } from '@/components/filter-sidebar';
import { FilterDrawer } from '@/components/filter-drawer';
import { buildShopQuery, parseShopFilters, SORT_OPTIONS, EMPTY_FILTERS } from '@/lib/search-params';
import type { ShopFilters } from '@/lib/search-params';

const PAGES_TO_FETCH = 3;
const PAGE_LIMIT = 50;

const FALLBACK_CATEGORIES = ['Whisky', 'Rum', 'Beer', 'Vodka', 'Gin', 'Wine', 'Tequila', 'RTD'];

const LOCAL_SORTS: Record<string, ((a: Product, b: Product) => number) | undefined> = {
  popular: (a, b) => b.popularity - a.popularity,
  rating: (a, b) => b.rating - a.rating,
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
};

function intensityOf(p: Product): 'smooth' | 'balanced' | 'bold' {
  if (p.abv >= 40) return 'bold';
  if (p.abv < 25) return 'smooth';
  return 'balanced';
}

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();

  const [filters, setFilters] = useState<ShopFilters>(() => parseShopFilters(searchParams));
  const lastPushed = useRef<string | null>(buildShopQuery(parseShopFilters(searchParams)));

  const [items, setItems] = useState<Product[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ name: string; productCount: number }[]>(
    FALLBACK_CATEGORIES.map((name) => ({ name, productCount: 0 })),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // external URL changes (back/forward, category links) → adopt into state
  useEffect(() => {
    const incoming = buildShopQuery(parseShopFilters(searchParams));
    if (incoming !== lastPushed.current) {
      lastPushed.current = incoming;
      setFilters(parseShopFilters(searchParams));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString]);

  // state → URL
  const setFiltersAndSync = useCallback(
    (patch: Partial<ShopFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        const query = buildShopQuery(next);
        if (query !== lastPushed.current) {
          lastPushed.current = query;
          router.replace(query ? `/shop?${query}` : '/shop', { scroll: false });
        }
        return next;
      });
    },
    [router],
  );

  const onClear = useCallback(() => setFiltersAndSync({ ...EMPTY_FILTERS }), [setFiltersAndSync]);

  const serverKey = [
    filters.q,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.abvMin,
    filters.abvMax,
    filters.flavors.join(','),
    filters.sort,
  ].join('|');

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('limit', String(PAGE_LIMIT));
    if (filters.q.trim()) params.set('q', filters.q.trim());
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.abvMin) params.set('abvMin', filters.abvMin);
    if (filters.abvMax) params.set('abvMax', filters.abvMax);
    if (filters.flavors.length) params.set('flavors', filters.flavors.join(','));
    if (filters.sort) params.set('sort', filters.sort);
    const query = params.toString();

    let cancelled = false;
    setLoading(true);
    Promise.all(
      Array.from({ length: PAGES_TO_FETCH }, (_, i) =>
        api
          .get<{ items: Product[]; total: number; page: number; limit: number }>(`/catalog/products?${query}&page=${i + 1}`)
          .then(({ data }) => data)
          .catch(() => ({ items: [], total: 0, page: i + 1, limit: PAGE_LIMIT })),
      ),
    ).then((pages) => {
      if (cancelled) return;
      const byId = new Map<string, Product>();
      pages.forEach((p) => p.items.forEach((item) => byId.set(item._id, item)));
      setItems([...byId.values()]);
      setServerTotal(pages[0]?.total ?? 0);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  useEffect(() => {
    api
      .get<CategoryInfo[]>('/catalog/categories')
      .then(({ data }) =>
        setCategories(Array.isArray(data) ? data.map((c) => ({ name: c.name, productCount: c.productCount })) : []),
      )
      .catch(() => undefined);
  }, []);

  const clientFilterCount =
    (filters.occasion ? 1 : 0) +
    (filters.sweetness ? 1 : 0) +
    (filters.body ? 1 : 0) +
    (filters.intensity ? 1 : 0) +
    (filters.availability ? 1 : 0);

  const filtered = useMemo(() => {
    let list = items;
    if (filters.occasion) list = list.filter((p) => p.occasionTags?.includes(filters.occasion));
    if (filters.sweetness) list = list.filter((p) => p.sweetness === filters.sweetness);
    if (filters.body) list = list.filter((p) => p.body === filters.body);
    if (filters.availability) list = list.filter((p) => p.stock > 0);
    if (filters.intensity) list = list.filter((p) => intensityOf(p) === filters.intensity);
    if (clientFilterCount > 0) {
      const sorter = LOCAL_SORTS[filters.sort];
      if (sorter) list = [...list].sort(sorter);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, clientFilterCount, filters.occasion, filters.sweetness, filters.body, filters.intensity, filters.availability, filters.sort]);

  const heading = filters.category || 'All drinks';
  const countLabel = clientFilterCount > 0 ? `${filtered.length} drinks match your taste` : `${filtered.length} drinks`;

  return (
    <div>
      <div className="flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-0.5">Shop</p>
            <h1 className="display-2">{heading}</h1>
          </div>
          <div aria-live="polite" className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
            {loading && filtered.length === 0 ? 'Loading…' : countLabel}
          </div>
          <label className="sr-only" htmlFor="shop-sort">Sort products</label>
          <select
            id="shop-sort"
            value={filters.sort}
            onChange={(e) => setFiltersAndSync({ sort: e.target.value })}
            className="input h-10 w-48 text-sm"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button onClick={() => setDrawerOpen(true)} className="btn btn-ghost btn-md lg:hidden" aria-expanded={drawerOpen}>
            Filters
            {clientFilterCount > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                {clientFilterCount}
              </span>
            )}
          </button>
        </div>
        <div className="divider" />
      </div>

      <div className="flex gap-8 pt-6">
        {/* Desktop sidebar */}
        <aside className="sticky top-24 hidden h-fit w-64 shrink-0 self-start lg:block" aria-label="Product filters">
          <FilterSidebar filters={filters} onChange={setFiltersAndSync} onClear={onClear} categories={categories} />
        </aside>

        <div className="min-w-0 flex-1">
          {loading && items.length === 0 ? (
            <ProductGrid products={[]} loading skeletonCount={8} />
          ) : filtered.length === 0 ? (
            <div>
              <EmptyState
                title="Nothing matches those filters"
                message="Try loosening a filter or two — or let the AI Bartender pick a pour for you."
              />
              <div className="mt-4 flex justify-center">
                <button onClick={onClear} className="btn btn-primary btn-sm">
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <ProductGrid products={filtered} loading={loading && items.length === 0} />
          )}
          {!loading && serverTotal > items.length && items.length > 0 && (
            <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-3)' }}>
              Showing {items.length} of {serverTotal} products
            </p>
          )}
        </div>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onChange={setFiltersAndSync}
        onClear={onClear}
        categories={categories}
      />
    </div>
  );
}
