'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Reveal } from '@/components/home-reveal';

const QUICK_PROMPTS = [
  'Help me choose a whisky',
  'Something for a party',
  'Wine for spicy food',
  'Best drink for beginners',
  'Something under ₹2,000',
  'Find something similar to this',
];

export function HomeAiBartender() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const ask = (q: string) => {
    const text = q.trim();
    router.push(text ? `/ai-bartender?q=${encodeURIComponent(text)}` : '/ai-bartender');
  };

  return (
    <Reveal>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-5 py-4">
          <p className="eyebrow">AI BARTENDER</p>
          <h2 className="display-2">MEET YOUR AI BARTENDER</h2>
          <p className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Tell it the mood, the table and the budget — it will pour the shortlist.
          </p>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              ask(query);
            }}
            className="flex max-w-lg items-center gap-2"
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="I want something smooth and slightly sweet under ₹3,000 for dinner."
              aria-label="Ask the AI Bartender"
              className="input"
            />
            <button type="submit" className="btn btn-primary btn-md shrink-0">
              ASK AI BARTENDER
            </button>
          </form>
          <div className="flex max-w-lg flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                className="chip chip-accent cursor-pointer transition hover:opacity-80"
                onClick={() => ask(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="card relative flex items-center justify-center overflow-hidden p-8" style={{ background: 'var(--accent-soft)' }}>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
            style={{ background: 'color-mix(in srgb, var(--accent) 20%, transparent)', filter: 'blur(48px)' }}
          />
          <div className="flex flex-col gap-3">
            {['Smooth, slightly sweet, under ₹3,000', 'A wine that can handle spicy curry', 'Something impressive to gift'].map((line, i) => (
              <div
                key={i}
                className="max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-2)',
                  marginLeft: i % 2 === 1 ? '3rem' : undefined,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
