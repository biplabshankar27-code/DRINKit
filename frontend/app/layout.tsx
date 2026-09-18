import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthNav } from '@/components/auth-nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'DRINKit — liquor, delivered',
  description: 'Fast liquor delivery with an AI sommelier to help you discover drinks.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0b0e]/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-amber-200">
              DRIN<span className="text-white">Kit</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-neutral-300">
              <Link href="/catalog" className="hover:text-amber-200">Catalog</Link>
              <Link href="/chat" className="hover:text-amber-200">Sommelier</Link>
              <Link href="/orders" className="hover:text-amber-200">Orders</Link>
              <Link href="/wishlist" className="hover:text-amber-200">Wishlist</Link>
              <Link href="/cart" className="hover:text-amber-200">Cart</Link>
              <AuthNav />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
