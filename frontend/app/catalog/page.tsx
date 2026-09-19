'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CatalogRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : '/shop');
  }, [params, router]);

  return <div className="skeleton h-40 w-full" aria-hidden />;
}
