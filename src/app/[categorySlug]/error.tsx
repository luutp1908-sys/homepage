'use client';

import { useEffect } from 'react';

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Category segment failed', error);
  }, [error]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-5xl flex-col items-start py-8 px-6 bg-white dark:bg-black">
        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="text-sm font-medium uppercase tracking-wide">Category unavailable</p>
          <h2 className="mt-2 text-2xl font-semibold">We could not load this category right now.</h2>
          <p className="mt-2 text-sm text-amber-800">Refresh this segment and try again.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      </main>
    </div>
  );
}