import Link from 'next/link';

const SHOP_LINKS = ['Whisky', 'Rum', 'Beer', 'Vodka', 'Gin', 'Wine', 'Tequila', 'RTD'];

const OCCASION_LINKS = ['Dinner', 'Party', 'Gift', 'Celebration'];

export function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="mx-auto max-w-7xl px-4 py-12 pb-28 md:pb-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="font-display text-xl font-bold" style={{ color: 'var(--accent)' }}>
              DRINKit
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Find your pour. Discover drinks picked for your taste, occasion and budget — with an AI
              Bartender who knows every bottle on the shelf.
            </p>
          </div>

          <nav aria-label="Shop categories">
            <div className="eyebrow mb-3">Shop</div>
            <ul className="space-y-2 text-sm">
              {SHOP_LINKS.map((c) => (
                <li key={c}>
                  <Link href={`/shop?category=${encodeURIComponent(c)}`} className="transition-colors" style={{ color: 'var(--text-2)' }}>
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Discover">
            <div className="eyebrow mb-3">Discover</div>
            <ul className="space-y-2 text-sm">
              {OCCASION_LINKS.map((o) => (
                <li key={o}>
                  <Link href={`/shop?occasion=${encodeURIComponent(o)}`} className="transition-colors" style={{ color: 'var(--text-2)' }}>
                    {o}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/discover" className="transition-colors" style={{ color: 'var(--text-2)' }}>
                  All collections
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Help">
            <div className="eyebrow mb-3">Help</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/ai-bartender" className="transition-colors" style={{ color: 'var(--text-2)' }}>
                  AI Bartender
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="transition-colors" style={{ color: 'var(--text-2)' }}>
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/admin" className="transition-colors" style={{ color: 'var(--text-2)' }}>
                  Admin
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="divider mt-10" />
        <div className="flex flex-col gap-2 pt-5 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ color: 'var(--text-3)' }}>
          <span>Drink responsibly. 21+.</span>
          <span>Product imagery belongs to respective brands.</span>
        </div>
      </div>
    </footer>
  );
}
