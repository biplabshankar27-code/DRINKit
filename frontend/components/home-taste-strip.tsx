'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SectionHeader } from '@/components/section-header';
import { Reveal } from '@/components/home-reveal';

const FLAVOR_TAGS = ['Citrus', 'Fruity', 'Smoky', 'Spicy', 'Woody', 'Vanilla', 'Floral', 'Caramel', 'Earthy'];

export function HomeTasteStrip() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      FLAVOR_TAGS.map((tag) =>
        api
          .get<{ total: number }>('/catalog/products', { params: { flavors: tag, limit: 1 } })
          .then(({ data }) => [tag, data?.total ?? 0] as const)
          .catch(() => [tag, 0] as const),
      ),
    ).then((entries) => {
      if (!cancelled) setCounts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Reveal>
      <section>
        <SectionHeader
          eyebrow="FLAVOR MAP"
          title="TASTE DISCOVERY"
          subtitle="Follow a flavor — every chip is a real shelf count."
        />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3">
          {FLAVOR_TAGS.map((tag) => (
            <Link
              key={tag}
              href={`/shop?flavors=${encodeURIComponent(tag)}`}
              className="card card-hover flex shrink-0 snap-start items-center gap-2 px-5 py-3"
            >
              <span className="font-display text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {tag}
              </span>
              <span className="chip chip-accent">{counts[tag] !== undefined ? `${counts[tag]} drinks` : '…'}</span>
            </Link>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
