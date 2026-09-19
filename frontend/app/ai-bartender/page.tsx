'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, apiMessage } from '@/lib/api';
import type { ChatMessage, ChatReply, Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth';
import { EmptyState } from '@/components/section-header';
import { BartenderResultCard } from '@/components/bartender-result-card';
import { useToast } from '@/components/toast';

interface Bubble extends ChatMessage {
  products?: Product[];
}

const QUICK_PROMPTS = [
  'Help me choose a whisky',
  'Something for a party',
  'Wine for spicy food',
  'Best drink for beginners',
  'Something under ₹2,000',
  'Find something similar to this',
];

function AiBartenderView() {
  const token = useAuthStore((s) => s.token);
  const params = useSearchParams();
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const sentRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!token) return;
    api
      .get<ChatMessage[]>('/assistant/chat/history')
      .then(async ({ data }) => {
        const history = data.map((m) => ({ ...m }));
        setMessages(history);
        const ids = [...new Set(history.flatMap((m) => m.recommendedProductIds ?? []))];
        if (ids.length === 0) return;
        const { data: byIds } = await api.get<{ items: Product[] }>('/catalog/products/by-ids', {
          params: { ids: ids.join(',') },
        });
        setMessages(history.map((m) => ({
          ...m,
          products:
            m.recommendedProductIds && m.recommendedProductIds.length > 0
              ? byIds.items.filter((p) => m.recommendedProductIds?.includes(p._id))
              : undefined,
        })));
      })
      .catch(() => undefined);
  }, [token]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setBusy(true);
    setError(false);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    try {
      const { data } = await api.post<ChatReply>('/assistant/chat', { message });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, products: data.recommendations },
      ]);
    } catch (e) {
      toast(apiMessage(e), 'error');
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const q = params.get('q');
    if (q && !sentRef.current) {
      sentRef.current = true;
      setInput(q);
      void send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  if (!token) {
    return (
      <EmptyState
        title="Sign in to chat with your AI Bartender"
        message="Create a free account to get personalised pours, pairing ideas and picks for your budget."
        ctaHref="/login"
        ctaLabel="Sign in"
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-[70vh] flex-col">
        <div className="mb-6">
          <p className="eyebrow mb-2">AI Bartender</p>
          <h1 className="display-2">Meet your AI Bartender</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-2)' }}>
            Tell me what you need.
          </p>
        </div>

        <div className="card flex-1 space-y-5 overflow-y-auto p-5" style={{ maxHeight: '65vh' }}>
          {messages.length === 0 && !busy && !error && (
            <div className="py-12 text-center">
              <p className="font-display text-lg" style={{ color: 'var(--text-2)' }}>
                Tell me what you need — a mood, a dish, a budget — and I&apos;ll pour suggestions.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] space-y-3 ${m.role === 'user' ? '' : 'w-full'}`}>
                <div
                  className={
                    m.role === 'user'
                      ? 'rounded-2xl px-4 py-3 text-sm leading-relaxed'
                      : 'card px-4 py-3 text-sm leading-relaxed'
                  }
                  style={
                    m.role === 'user'
                      ? { background: 'var(--accent-soft)', color: 'var(--text)' }
                      : undefined
                  }
                >
                  <p className={`whitespace-pre-wrap ${m.role === 'assistant' ? 'font-display text-[15px]' : ''}`}>
                    {m.content}
                  </p>
                </div>
                {m.products && m.products.length > 0 && (
                  <div className="grid gap-3">
                    {m.products.map((p) => (
                      <BartenderResultCard key={p._id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="w-full max-w-md space-y-3">
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-4 w-40" />
              </div>
              <p className="sr-only">Pouring suggestions…</p>
            </div>
          )}
          {busy && (
            <p className="text-xs italic" style={{ color: 'var(--text-3)' }}>Pouring suggestions…</p>
          )}
          {error && !busy && (
            <EmptyState
              title="Your AI Bartender is temporarily unavailable."
              message="Give it another moment, then send your message again."
              ctaHref="/shop"
              ctaLabel="Browse Drinks"
            />
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); void send(); }}
          className="mt-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about spirits, pairings, budgets…"
            aria-label="Message your AI Bartender"
            className="input flex-1"
          />
          <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary btn-md">
            Send
          </button>
        </form>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-3">
          <p className="eyebrow mb-2">#quick prompts</p>
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => void send(p)}
              disabled={busy}
              className="chip chip-accent w-full cursor-pointer justify-center py-2 text-center"
            >
              {p}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default function AiBartenderPage() {
  return (
    <Suspense fallback={<div className="skeleton my-10 h-64 w-full" />}>
      <AiBartenderView />
    </Suspense>
  );
}