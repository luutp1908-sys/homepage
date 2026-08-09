'use client';

import { useEffect } from 'react';

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Root browse segment failed', error);
  }, [error]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-5xl flex-col items-start py-8 px-6 bg-white dark:bg-black">
        <div className="w-full rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <p className="text-sm font-medium uppercase tracking-wide">Browse unavailable</p>
          <h2 className="mt-2 text-2xl font-semibold">Something went wrong while loading templates.</h2>
          <p className="mt-2 text-sm text-rose-800">Try again to reload this section.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      </main>
    </div>
  );
}