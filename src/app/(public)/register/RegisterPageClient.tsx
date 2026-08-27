'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { persistAuthTokens } from '../../../shared/auth/getAuthHeaders';

const BE_BASE = process.env.NEXT_PUBLIC_BE_API_BASE || 'http://localhost:4000';

export default function RegisterPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: { email: string; password: string; displayName?: string } = {
        email,
        password,
      };

      const trimmedDisplayName = displayName.trim();
      if (trimmedDisplayName.length > 0) {
        payload.displayName = trimmedDisplayName;
      }

      const response = await fetch(`${BE_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Registration failed');
      }

      const data = await response.json();
      const token = data?.data?.accessToken ?? null;
      const refreshToken = data?.data?.refreshToken ?? null;
      persistAuthTokens(token, refreshToken);

      router.push('/workspaces');
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-zinc-600">Create your account to save and manage your draft workspaces.</p>

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
            Display name (optional)
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={120}
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <label className="block text-sm font-medium">
            Confirm password
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <button className="w-full rounded bg-black px-4 py-2 text-white" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-sm text-zinc-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
