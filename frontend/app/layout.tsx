import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { AppHeader } from '@/components/app-header';
import { Footer } from '@/components/footer';
import { MobileNav } from '@/components/mobile-nav';
import { SessionBootstrap } from '@/components/session-bootstrap';
import { ToastProvider } from '@/components/toast';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DRINKit — Find your pour',
  description: 'Discover drinks picked for your taste, occasion and budget. Shop premium liquor with an AI Bartender.',
};

const themeScript = `(function(){try{var t=localStorage.getItem('drinkit-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`min-h-screen antialiased ${fraunces.variable} ${inter.variable}`}>
        <ToastProvider>
          <SessionBootstrap>
            <AppHeader />
            <main className="mx-auto max-w-7xl px-4 pb-28 md:pb-8" style={{ paddingTop: '1.5rem' }}>
              {children}
            </main>
            <Footer />
            <MobileNav />
          </SessionBootstrap>
        </ToastProvider>
      </body>
    </html>
  );
}
