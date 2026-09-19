'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

const cartCountStyle = (count: number): React.CSSProperties | undefined =>
  !count ? { display: 'none' } : undefined;

export function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((s) =>
    s.cart ? s.cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0,
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const itemClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider`;
  const itemStyle = (active: boolean): React.CSSProperties =>
    active ? { color: 'var(--accent)' } : { color: 'var(--text-2)' };

  return (
    <nav
      aria-label="Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        borderColor: 'var(--border)',
        background: 'color-mix(in srgb, var(--surface) 94%, transparent)',
        backdropFilter: 'blur(14px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch">
        <Link href="/shop" aria-current={isActive('/shop') ? 'page' : undefined} aria-label="Shop" className={itemClass(isActive('/shop'))} style={itemStyle(isActive('/shop'))}>
          <span aria-hidden className="text-lg">◈</span>
          <span>Shop</span>
        </Link>
        <Link href="/discover" aria-current={isActive('/discover') ? 'page' : undefined} aria-label="Discover" className={itemClass(isActive('/discover'))} style={itemStyle(isActive('/discover'))}>
          <span aria-hidden className="text-lg">✦</span>
          <span>Discover</span>
        </Link>
        <Link href="/ai-bartender" aria-current={isActive('/ai-bartender') ? 'page' : undefined} aria-label="AI Bartender" className={itemClass(isActive('/ai-bartender'))} style={itemStyle(isActive('/ai-bartender'))}>
          <span aria-hidden className="text-lg">🍸</span>
          <span>Bartender</span>
        </Link>
        <Link href="/cart" aria-current={isActive('/cart') ? 'page' : undefined} aria-label={`Cart, ${cartCount} items`} className={itemClass(isActive('/cart'))} style={itemStyle(isActive('/cart'))}>
          <span className="relative" aria-hidden>
            <span className="text-lg">⛁</span>
            <span
              className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)', ...cartCountStyle(cartCount) } as React.CSSProperties}
            >
              {cartCount}
            </span>
          </span>
          <span>Cart</span>
        </Link>
        <Link href={user ? '/account' : '/login'} aria-current={isActive('/account') ? 'page' : undefined} aria-label="Account" className={itemClass(isActive('/account'))} style={itemStyle(isActive('/account'))}>
          <span
            aria-hidden
            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: 'var(--elevated)', color: 'var(--text)' }}
          >
            {user ? user.name.charAt(0).toUpperCase() : '◌'}
          </span>
          <span>{user ? 'Account' : 'Sign in'}</span>
        </Link>
      </div>
    </nav>
  );
}
