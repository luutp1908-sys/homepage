'use client';

import Link from 'next/link';
import { useAuthState } from '../../shared/auth/useAuthState';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthState();

  return (
    <div className="min-h-screen bg-zinc-50">
      {!isLoading && isAuthenticated ? (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col items-center border-r border-zinc-200 bg-white py-4 shadow-sm">
          <Link
            href="/workspaces"
            title="Workspace"
            aria-label="Workspace"
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18" />
            </svg>
          </Link>

          <div className="flex-1" />

          <Link
            href="/account"
            title="User info"
            aria-label="User info"
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 1 1 14 0" />
            </svg>
          </Link>
        </aside>
      ) : null}

      <div className={!isLoading && isAuthenticated ? 'ml-20 flex min-h-screen flex-col' : 'flex min-h-screen flex-col'}>
        {children}
      </div>
    </div>
  );
}
