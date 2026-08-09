'use client';

import { useEffect } from 'react';

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Workspaces segment failed', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(255,240,210,0.9),_transparent_55%),linear-gradient(135deg,_#f8fafc_0%,_#fef7ed_100%)]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-[28px] border border-rose-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">Workspace view unavailable</p>
          <h2 className="mt-3 text-3xl font-semibold text-zinc-900">Something failed while loading workspaces.</h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-700">You can retry this segment without reloading the whole app.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Retry
          </button>
        </section>
      </main>
    </div>
  );
}