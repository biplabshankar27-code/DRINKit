'use client';

import Link from 'next/link';
import { SectionHeader, EmptyState } from '@/components/section-header';
import { ProductCard } from '@/components/product-card';
import { Reveal } from '@/components/home-reveal';
import type { Product } from '@/lib/types';

export interface EditorialRowProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: Product[];
  loading?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  skeletonCount?: number;
  /** When set, hide the row entirely if there are no products (instead of an EmptyState). */
  hideWhenEmpty?: boolean;
}

export function EditorialRow({
  eyebrow,
  title,
  subtitle,
  products,
  loading = false,
  ctaHref,
  ctaLabel = 'Shop the edit',
  skeletonCount = 8,
  hideWhenEmpty = false,
}: EditorialRowProps) {
  if (!loading && hideWhenEmpty && products.length === 0) return null;

  return (
    <Reveal>
      <section>
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} ctaHref={ctaHref} ctaLabel={ctaLabel} />
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card w-[240px] shrink-0 overflow-hidden">
                <div className="skeleton aspect-[3/4] rounded-none" />
                <div className="flex flex-col gap-2 p-4">
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-8 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState title="Nothing here yet" message="This edit is being restocked. Browse the full shop instead." ctaHref="/shop" ctaLabel="Browse all" />
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: 'thin' }}>
            {products.map((p) => (
              <div key={p._id} className="w-[220px] shrink-0 snap-start sm:w-[240px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>
    </Reveal>
  );
}

export function EditorialCard({ href, title, subtitle, image, footerNote }: { href: string; title: string; subtitle?: string; image?: string; footerNote?: string }) {
  return (
    <Link href={href} className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative block aspect-[16/10] overflow-hidden" style={{ background: 'var(--elevated)' }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full" style={{ background: 'linear-gradient(135deg, var(--accent-soft), var(--elevated))' }} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: 'color-mix(in srgb, var(--accent) 55%, transparent)' }} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="font-display text-lg font-semibold leading-snug" style={{ color: 'var(--text)' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            {subtitle}
          </p>
        )}
        {footerNote && (
          <p className="eyebrow mt-auto pt-3" style={{ fontSize: '0.62rem' }}>
            {footerNote}
          </p>
        )}
      </div>
    </Link>
  );
}
