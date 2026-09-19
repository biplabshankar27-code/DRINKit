'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiMessage } from '@/lib/api';
import type { AuthTokens } from '@/lib/types';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/toast';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register' ? { email, password, name } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw { response: { data } };
      setAuth(data as AuthTokens);
      toast(mode === 'login' ? 'Welcome back' : 'Welcome to DRINKit', 'success');
      router.push('/');
    } catch (err) {
      toast(apiMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-10">
      <p className="eyebrow mb-2">DRINKit account</p>
      <h1 className="display-2">{mode === 'login' ? 'Welcome back' : 'Join DRINKit'}</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-2)' }}>
        {mode === 'login' ? 'Good to see you again — sign in to continue.' : 'Create an account to start pouring.'}
      </p>
      <div className="surface-muted mt-4 px-4 py-2 text-xs" style={{ color: 'var(--text-2)' }}>
        Demo: demo@drinkit.dev / Demo@123
      </div>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        {mode === 'register' && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name" className="input" required />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" className="input" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" className="input" required />
        <button type="submit" disabled={busy} className="btn btn-primary btn-md w-full">
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="w-full text-center text-sm link"
        >
          {mode === 'login' ? 'New here? Create account' : 'Already have an account? Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-[11px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
        We&apos;ll only ever use your details to run your account — nothing is shared, nothing is sold.
      </p>
    </div>
  );
}
