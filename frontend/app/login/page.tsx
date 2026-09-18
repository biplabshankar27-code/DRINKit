'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiMessage } from '@/lib/api';
import type { AuthTokens } from '@/lib/types';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register' ? { email, password, name } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw { response: { data } };
      setAuth(data as AuthTokens);
      router.push('/');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="text-2xl font-black">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Demo: demo@drinkit.dev / Demo@123
      </p>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        {mode === 'register' && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input" required />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input" required />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-accent h-10 w-full disabled:opacity-50">
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}
        </button>
        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          className="w-full text-center text-sm text-amber-200 hover:text-amber-100"
        >
          {mode === 'login' ? 'New here? Create account' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
