'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export function AuthNav() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!token || !user) {
    return (
      <Link href="/login" className="text-amber-200 hover:text-amber-100">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-neutral-400 sm:inline">{user.name}</span>
      <button onClick={logout} className="text-neutral-400 hover:text-red-400">
        Sign out
      </button>
    </div>
  );
}
