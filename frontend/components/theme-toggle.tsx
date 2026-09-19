"use client";

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = ((): 'light' | 'dark' => {
      try {
        const t = localStorage.getItem('drinkit-theme');
        if (t === 'dark' || t === 'light') return t;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch {
        return 'light';
      }
    })();
    setTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('drinkit-theme', next); } catch {}
    document.documentElement.setAttribute('data-theme', next);
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="btn btn-ghost btn-sm px-2.5"
      style={{ borderColor: 'var(--border)' }}
    >
      {theme === 'light' ? '☾' : '☕'}
    </button>
  );
}
