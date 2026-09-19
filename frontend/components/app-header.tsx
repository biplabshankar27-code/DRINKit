'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthNav } from '@/components/auth-nav';
import { SearchBar } from '@/components/search-bar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';

const NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/discover', label: 'Discover' },
  { href: '/ai-bartender', label: 'AI Bartender' },
];

const countStyle = (count: number): React.CSSProperties | undefined =>
  !count ? { display: 'none' } : undefined;

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const cartCount = useCartStore((s) =>
    s.cart ? s.cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0,
  );
  const wishlistCount = useWishlistStore((s) => s.productIds.length);

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 92%, transparent)', backdropFilter: 'blur(14px)' }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        {/* Logo */}
        <Link href="/" className="font-display text-xl font-bold tracking-tight shrink-0" style={{ color: 'var(--accent)' }}>
          DRINKit
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-1 shrink-0">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors"
              style={{ color: 'var(--text-2)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Search (desktop) */}
        <div className="hidden md:block flex-1 max-w-md ml-2">
          <SearchBar />
        </div>

        <div className="flex-1 md:hidden" />

        {/* Icon links */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <Link
            href="/wishlist"
            aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors"
            style={{ color: 'var(--text-2)', background: 'var(--elevated)' }}
          >
            ♥
            <span
              className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
              style={{ background: 'var(--danger)', color: '#fff', ...countStyle(wishlistCount) } as React.CSSProperties}
            >
              {wishlistCount}
            </span>
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors"
            style={{ color: 'var(--text-2)', background: 'var(--elevated)' }}
          >
            ⛁
            <span
              className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)', ...countStyle(cartCount) } as React.CSSProperties}
            >
              {cartCount}
            </span>
          </Link>
          <ThemeToggle />
          <AuthNav />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: 'var(--elevated)', color: 'var(--text)' }}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-50 md:hidden flex flex-col"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex h-16 items-center justify-between px-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="font-display text-xl font-bold" style={{ color: 'var(--accent)' }}>
                DRINKit
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: 'var(--elevated)', color: 'var(--text)' }}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-6">
              <SearchBar />
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-2xl font-semibold py-3 border-b"
                  style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
                >
                  {l.label}
                </Link>
              ))}
              <Link href="/wishlist" onClick={() => setOpen(false)} className="font-display text-2xl font-semibold py-3 border-b" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                Wishlist {wishlistCount > 0 && <span style={{ color: 'var(--accent)' }}>({wishlistCount})</span>}
              </Link>
              <Link href="/cart" onClick={() => setOpen(false)} className="font-display text-2xl font-semibold py-3 border-b" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                Cart {cartCount > 0 && <span style={{ color: 'var(--accent)' }}>({cartCount})</span>}
              </Link>
              <div className="mt-6 flex items-center justify-between">
                <AuthNav />
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
