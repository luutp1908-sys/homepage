'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuthState } from '../../shared/auth/useAuthState';

export default function AuthNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuthState();

  const currentSearch = searchParams.toString();
  const returnTo = `${pathname}${currentSearch ? `?${currentSearch}` : ''}`;

  if (isLoading) {
    return <div className="h-5 w-20 animate-pulse rounded bg-zinc-200" />;
  }

  return isAuthenticated ? (
    <Link href="/account" className="hover:text-black">Account</Link>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/register" className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100">
        Sign up
      </Link>
      <Link
        href={{
          pathname: '/login',
          query: { next: returnTo },
        }}
        className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
      >
        Sign in
      </Link>
    </div>
  );
}
