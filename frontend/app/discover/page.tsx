'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { COLLECTIONS } from '@/lib/collections';
import type { Product } from '@/lib/types';
import { EmptyState } from '@/components/section-header';
import { Reveal } from '@/components/home-reveal';

interface Story {
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  count: number;
  thumbs: Product[];
}

export default function DiscoverPage() {
  const [pool, setPool] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      [1, 2, 3].map((page) =>
        api
          .get<{ items: Product[] }>('/catalog/products', { params: { limit: 50, page, sort: 'popular' } })
          .then(({ data }) => data?.items ?? [])
          .catch(() => [] as Product[]),
      ),
    ).then((batches) => {
      if (cancelled) return;
      const seen = new Set<string>();
      const items: Product[] = [];
      for (const batch of batches.flat()) {
        if (!seen.has(batch._id)) {
          seen.add(batch._id);
          items.push(batch);
        }
      }
      setPool(items);
      setLoading(false);
      if (items.length === 0) setError(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stories = useMemo<Story[]>(
    () =>
      COLLECTIONS.map((c) => {
        const matched = pool.filter(c.match);
        return {
          slug: c.slug,
          title: c.title,
          subtitle: c.subtitle,
          href: c.href,
          count: matched.length,
          thumbs: matched.slice(0, 3),
        };
      }),
    [pool],
  );

  return (
    <div className="space-y-10 py-4 md:py-8">
      <section className="max-w-2xl space-y-3">
        <p className="eyebrow">DISCOVER</p>
        <h1 className="display-1">THE DRINKIT EDIT</h1>
        <p className="text-base leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Six curated stories from the real shelf — weekends, budgets, beginners, craft and the table.
          Each one ends somewhere drinkable.
        </p>
      </section>

      {error ? (
        <EmptyState title="Something went wrong" message="We couldn't load the catalog." ctaHref="/shop" ctaLabel="Browse the shop" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="grid grid-cols-3 gap-0.5">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="skeleton aspect-[3/4] rounded-none" />
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 p-5">
                    <div className="skeleton h-5 w-2/3" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
              ))
            : stories.map((story, i) => (
                <Reveal key={story.slug} delay={(i % 3) * 0.05}>
                  <Link href={story.href} className="card card-hover group flex flex-col overflow-hidden">
                    <div className="grid grid-cols-3 gap-0.5" style={{ background: 'var(--elevated)' }}>
                      {story.thumbs.length > 0 ? (
                        story.thumbs.map((p) => (
                          <div key={p._id} className="aspect-[3/4] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                              loading="lazy"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 aspect-[3/1]" style={{ background: 'linear-gradient(135deg, var(--accent-soft), var(--elevated))' }} />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 p-5">
                      <h2 className="font-display text-lg font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                        {story.title}
                      </h2>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        {story.subtitle}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <span className="chip chip-accent">{story.count} hand-picked picks</span>
                        <span className="eyebrow group-hover:underline" style={{ fontSize: '0.62rem' }}>
                          Explore →
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
        </div>
      )}
    </div>
  );
}
