'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

export function HomeHero() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const yImage = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const search = () => {
    const q = term.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  return (
    <section ref={sectionRef} className="grid items-center gap-10 py-10 md:py-16 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col items-start gap-5">
        <p className="eyebrow">DISCOVER YOUR NEXT POUR</p>
        <h1 className="display-1">FIND YOUR POUR.</h1>
        <p className="max-w-md text-base leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Discover drinks picked for your taste, occasion and budget.
        </p>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
          className="mt-1 flex w-full max-w-lg items-center gap-2"
        >
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search whisky, rum, wine…"
            aria-label="Search drinks"
            className="input h-12"
          />
          <button type="submit" className="btn btn-primary btn-md shrink-0" aria-label="Search">
            ⌕
          </button>
        </form>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-primary btn-lg">
            SHOP NOW
          </Link>
          <Link href="/ai-bartender" className="btn btn-ghost btn-lg">
            ASK AI BARTENDER
          </Link>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute h-[22rem] w-[22rem] rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--accent) 26%, transparent)',
            filter: 'blur(64px)',
            ...(reduced ? {} : { y: yGlow }),
          }}
        />
        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-2xl"
          style={{ boxShadow: 'var(--shadow-2)', ...(reduced ? {} : { y: yImage }) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/whisky/talisker_dark_storm_whisky.jpg"
            alt="Talisker dark storm whisky bottle"
            className="aspect-[4/5] w-full object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}
