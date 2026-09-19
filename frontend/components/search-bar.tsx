'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [term, setTerm] = useState('');

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = term.trim();
        router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
      }}
      className="relative w-full"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
        style={{ color: 'var(--text-3)' }}
      >
        ⌕
      </span>
      <input
        type="search"
        value={term}
        autoFocus={autoFocus}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search whisky, rum, wine…"
        aria-label="Search products"
        className="input pl-8 pr-4 text-sm"
      />
    </form>
  );
}
