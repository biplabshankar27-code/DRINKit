'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ChatRedirect() {
  const params = useSearchParams();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const q = params.toString();
    window.location.replace(q ? `/ai-bartender?${q}` : '/ai-bartender');
  }, [params]);

  return (
    <div className="py-20 text-center text-sm" style={{ color: 'var(--text-2)' }}>
      Taking you to your AI Bartender…
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="skeleton my-20 mx-auto h-4 max-w-xs" />}>
      <ChatRedirect />
    </Suspense>
  );
}
