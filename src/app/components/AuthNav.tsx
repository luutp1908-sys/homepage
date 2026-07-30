'use client';

import { useEffect, useState } from 'react';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('homepage_access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export default function AuthNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/user/me', { cache: 'no-store', headers: getAuthHeaders() });
        setIsAuthenticated(res.ok);
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
    <a href="/login" className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-zinc-800">
      Sign in
    </a>
  );
}
