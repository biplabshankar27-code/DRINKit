'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, apiMessage } from '@/lib/api';
import type { ChatMessage, ChatReply, Product } from '@/lib/types';
import { useAuthStore } from '@/store/auth';

interface Bubble extends ChatMessage {
  products?: Product[];
}

const SUGGESTIONS = [
  'Something smoky under ₹5000?',
  'Best beer for spicy biryani',
  'Wine to gift a wine snob',
  'Explain gin vs vodka vs rum',
];

export default function ChatPage() {
  const token = useAuthStore((s) => s.token);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return; }
    api.get('/assistant/chat/history')
      .then(({ data }) => setMessages((data as ChatMessage[]).map((m) => ({ ...m }))))
      .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setBusy(true);
    setError('');
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    try {
      const { data } = await api.post<ChatReply>('/assistant/chat', { message });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, products: data.recommendations },
      ]);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-3xl flex-col">
      <div className="flex items-center justify-between py-3">
        <div>
          <h1 className="text-xl font-black">Rowan</h1>
          <p className="text-xs text-neutral-400">Your AI sommelier — asks about taste, food pairings, occasions</p>
        </div>
      </div>

      <div className="card flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-lg font-semibold">Welcome to DRINKit 🍷</p>
            <p className="mt-1 text-sm text-neutral-400">Tell me what you're in the mood for, or pick a starter:</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="chip cursor-pointer hover:border-amber-200 hover:text-amber-200">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] space-y-3 rounded-2xl px-4 py-3 text-sm ${m.role === 'user' ? 'bg-amber-200/10' : 'bg-white/5'}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {m.products && m.products.length > 0 && (
                <div className="grid gap-2">
                  {m.products.map((p) => (
                    <Link key={p._id} href={`/product/${p._id}`} className="flex items-center gap-3 rounded-xl border border-white/10 p-2 hover:border-amber-200/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={p.name} className="h-14 w-11 rounded-lg object-cover" />
                      <div className="text-xs">
                        <p className="font-semibold text-amber-200">{p.name}</p>
                        <p className="text-neutral-400">₹{p.price} · {p.abv}% · {p.category}</p>
                        <p className="mt-0.5 text-neutral-500">{p.flavorTags.slice(0, 3).join(', ')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && <div className="flex justify-start"><div className="skeleton h-12 w-2/3" /></div>}
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex gap-2 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about spirits, pairings, cocktails…"
          className="input flex-1"
        />
        <button type="submit" disabled={busy} className="btn btn-accent h-10 px-6 disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}
