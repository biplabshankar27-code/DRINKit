'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastContent {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastContent[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-2), { id, message, variant }]);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setTimeout(() => setItems((prev) => prev.slice(1)), 2600);
    return () => clearTimeout(timer);
  }, [items]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-24 left-1/2 z-[90] flex -translate-x-1/2 flex-col gap-2 sm:bottom-6"
      >
        {items.map((t) => (
          <div key={t.id} role="status" className="toast pointer-events-auto" data-variant={t.variant}>
            <span style={{ color: t.variant === 'error' ? 'var(--danger)' : t.variant === 'info' ? 'var(--accent)' : 'var(--success)', marginRight: 8 }}>
              {t.variant === 'error' ? '✕' : '✓'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
