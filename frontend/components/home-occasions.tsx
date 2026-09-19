'use client';

import Link from 'next/link';
import { SectionHeader } from '@/components/section-header';
import { Reveal } from '@/components/home-reveal';
import { OCCASIONS } from '@/lib/occasions';

const OCCASION_COPY: Record<string, string> = {
  Dinner: 'Food-first bottles for the table',
  Party: 'Loud, fun, crowd-pleasers',
  Celebration: 'Bottles that mark the moment',
  Unwind: 'Slow sips for quiet evenings',
  'Movie Night': 'Easy picks for the couch',
  Gifting: 'Beautiful bottles to give',
  'Cocktail Night': 'Built for mixing',
  Weekend: 'Slow mornings, long evenings',
};

const TINTS = ['var(--accent)', 'var(--oak)', 'var(--berry)', 'var(--success)'];

export function HomeOccasions() {
  return (
    <Reveal>
      <section>
        <SectionHeader
          eyebrow="SHOP BY OCCASION"
          title="WHAT ARE YOU SHOPPING FOR?"
          subtitle="Match the bottle to the moment."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {OCCASIONS.map((occasion, i) => {
            const tint = TINTS[i % TINTS.length];
            return (
              <Link
                key={occasion}
                href={`/shop?occasion=${encodeURIComponent(occasion)}`}
                className="card card-hover surface-muted group flex flex-col overflow-hidden"
              >
                <div className="h-1.5 w-full" style={{ background: tint }} aria-hidden />
                <div className="flex flex-1 flex-col gap-1.5 p-5">
                  <span className="font-display text-lg font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                    {occasion}
                  </span>
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {OCCASION_COPY[occasion] ?? ''}
                  </span>
                  <span className="eyebrow mt-auto pt-3 group-hover:underline" style={{ fontSize: '0.62rem', color: tint }}>
                    Explore →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </Reveal>
  );
}
