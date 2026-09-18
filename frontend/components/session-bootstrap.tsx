'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { api } from '@/lib/api';

const AUTO_LOGIN = process.env.NEXT_PUBLIC_AUTO_LOGIN === 'on';
const AUTO_LOGIN_EMAIL = process.env.NEXT_PUBLIC_AUTO_LOGIN_EMAIL ?? '';
const AUTO_LOGIN_PASSWORD = process.env.NEXT_PUBLIC_AUTO_LOGIN_PASSWORD ?? '';

export function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const reset = async () => {
      try {
        window.localStorage.removeItem('drinkit-auth');
        window.localStorage.removeItem('drinkit-cart');
        window.localStorage.removeItem('drinkit-wishlist');
        useAuthStore.setState({ token: null, user: null });
        useCartStore.setState({ cart: null });
        useWishlistStore.setState({ productIds: [] });

        if (AUTO_LOGIN && AUTO_LOGIN_EMAIL && AUTO_LOGIN_PASSWORD) {
          const { data } = await api.post('/auth/login', {
            email: AUTO_LOGIN_EMAIL,
            password: AUTO_LOGIN_PASSWORD,
          });
          useAuthStore.setState({ token: data.accessToken, user: data.user });
          void api.delete('/assistant/chat/history').catch(() => undefined);
        }
      } catch {
        // backend down or bad creds: render as guest instead of crashing
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void reset();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse rounded-full bg-amber-200/15 px-6 py-3 text-sm font-semibold tracking-wide text-amber-200">
          DRINKit
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
