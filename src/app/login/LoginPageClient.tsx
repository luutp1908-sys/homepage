'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { persistAuthTokens } from '../../shared/auth/getAuthHeaders';
import { sanitizeNextPath } from './sanitizeNextPath';

const BE_BASE = process.env.NEXT_PUBLIC_BE_API_BASE || 'http://localhost:4000';

type LoginPageClientProps = {
  variant?: 'page' | 'modal';
  nextPath?: string | null;
};

export default function LoginPageClient({ variant = 'page', nextPath }: LoginPageClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resolvedNextPath = sanitizeNextPath(nextPath ?? null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`${BE_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Login failed');
      }

      const payload = await response.json();
      const token = payload?.data?.accessToken ?? null;
      const refreshToken = payload?.data?.refreshToken ?? null;

      persistAuthTokens(token, refreshToken);

      router.replace(resolvedNextPath);
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const card = (
    <div className="w-full rounded border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">Use your account email and password to continue.</p>

        {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button className="w-full rounded bg-black px-4 py-2 text-white" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className="mt-5 text-sm text-zinc-600">
          New here?{' '}
          <Link href="/register" className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700">
            Create account
          </Link>
        </p>
      </div>
  );

  if (variant === 'modal') {
    return card;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-16">
      {card}
    </div>
  );
}
