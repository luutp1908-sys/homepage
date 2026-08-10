'use client';

import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '../../shared/auth/useAuth';

export default function AuthNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await fetchCurrentUser();
        setIsAuthenticated(Boolean(user?.id));
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="h-5 w-20 animate-pulse rounded bg-zinc-200" />;
  }

  return isAuthenticated ? (
    <a href="/account" className="hover:text-black">Account</a>
  ) : (
    <div className="flex items-center gap-2">
      <a href="/register" className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100">
        Sign up
      </a>
      <a href="/login" className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-zinc-800">
        Sign in
      </a>
    </div>
  );
}
