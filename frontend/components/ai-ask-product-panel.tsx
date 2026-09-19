'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, apiMessage } from '@/lib/api';
import type { Product } from '@/lib/types';
import { PriceDisplay } from './price-display';
import { useToast } from './toast';
import { Skeleton } from './skeleton';
const promptMap = [
  { label: 'What tastes similar to this?', text: 'What tastes similar to {name}? Suggest drinks from the catalog.' },
  { label: 'What food goes with this?', text: 'What food pairs well with {name}?' },
  { label: 'How should I serve this?', text: 'How should I serve and drink {name}?' },
  { label: 'What cocktail can I make with this?', text: 'What cocktail can I make with {name}?' },
  { label: 'Is this good for beginners?', text: 'Is {name} good for beginners?' },
  { label: 'Show me a cheaper alternative', text: 'What is a cheaper alternative to {name} from your catalog?' },
];

export function AiAskProductPanel({ productId, productIdTitle }: { productId: string; productIdTitle: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('');
  const [recs, setRecs] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const ask = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setReply('');
    setRecs([]);
    try {
      const message = text.replace('{name}', productIdTitle);
      const { data } = await api.post<{ reply: string; recommendations: Product[] }>(`/assistant/chat`, { message: `Regarding ${productIdTitle}: ${message}` });
      setReply(data.reply);
      setRecs(data.recommendations ?? []);
    } catch {
      toast('Your AI Bartender is unavailable right now', 'error');
    } finally {
      setLoading(false);
    }
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('drinkit-auth') : null;
  if (!token && !open) {
    return (
      <section className="card p-6 text-center">
        <p className="display-2 font-display">Ask your AI Bartender</p>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-2)' }}>
          Log in to get personalized serving, pairing and alternative suggestions for this bottle.
        </p>
        <Link href="/login" className="btn btn-primary btn-sm mt-4">Log in</Link>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">AI Bartender</p>
          <h2 className="display-2 font-display text-xl">Ask your AI Bartender</h2>
        </div>
        {open && (
          <button onClick={() => setOpen(false)} className="btn btn-quiet btn-sm">Collapse</button>
        )}
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {promptMap.map((p) => (
              <button key={p.label} onClick={() => ask(p.text)} className="chip chip-accent" disabled={loading}>
                {p.label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); ask(question); }}
            className="flex gap-2"
          >
            <input
              className="input"
              placeholder={`Ask anything about ${productIdTitle}…`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button type="submit" disabled={loading} className="btn btn-primary btn-md">Ask</button>
          </form>

          {loading && (
            <div className="space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-24 w-full" />
            </div>
          )}

          {!loading && reply && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply}</p>
          )}

          {!loading && recs.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {recs.map((p) => (
                <Link key={p._id} href={`/product/${p._id}`} className="card card-hover flex items-center gap-3 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} className="h-16 w-12 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <PriceDisplay price={p.price} compareAtPrice={p.compareAtPrice} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="btn btn-ghost btn-md mt-4">Ask about this bottle</button>
      )}
    </section>
  );
}
