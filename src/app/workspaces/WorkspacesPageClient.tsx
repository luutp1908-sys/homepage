'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '../../shared/auth/getAuthHeaders';
import { DraftSortBy, DraftSortOrder, UserDraftSummary, fetchUserDrafts } from '../../shared/workspaces/userDrafts';

type SortOption = 'updatedAt-desc' | 'createdAt-desc' | 'createdAt-asc';

const PAGE_SIZE = 10;

function formatDate(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function resolveSort(value: SortOption): { sortBy: DraftSortBy; sortOrder: DraftSortOrder } {
  if (value === 'createdAt-asc') return { sortBy: 'createdAt', sortOrder: 'asc' };
  if (value === 'createdAt-desc') return { sortBy: 'createdAt', sortOrder: 'desc' };
  return { sortBy: 'updatedAt', sortOrder: 'desc' };
}

export default function WorkspacesPageClient() {
  const [items, setItems] = useState<UserDraftSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt-desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const editorBase = (process.env.NEXT_PUBLIC_EDITOR_APP_URL || 'http://localhost:5174').replace(/\/+$/, '');

  const getDraftEditorUrl = (draftId: string) => {
    return `${editorBase}/draft/${encodeURIComponent(draftId)}`;
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      setIsUnauthorized(false);

      const { sortBy, sortOrder } = resolveSort(sortOption);

      try {
        const result = await fetchUserDrafts(
          {
            page,
            pageSize: PAGE_SIZE,
            sortBy,
            sortOrder,
          },
          getAuthHeaders(),
        );

        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
      } catch (err: any) {
        if (cancelled) return;
        const message = typeof err?.message === 'string' ? err.message : 'Failed to load drafts';
        if (message.includes('401')) {
          setIsUnauthorized(true);
        }
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [page, sortOption]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50">
      <main className="w-full max-w-5xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 rounded border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Workspaces</h1>
            <p className="mt-1 text-sm text-zinc-600">Your draft templates, sorted by recent activity.</p>
          </div>

          <label className="text-sm font-medium text-zinc-700">
            Sort by
            <select
              className="mt-1 block w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
              value={sortOption}
              onChange={(event) => {
                setSortOption(event.target.value as SortOption);
                setPage(1);
              }}
            >
              <option value="updatedAt-desc">Last updated (newest)</option>
              <option value="createdAt-desc">Created (newest)</option>
              <option value="createdAt-asc">Created (oldest)</option>
            </select>
          </label>
        </div>

        {isUnauthorized ? (
          <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <p className="text-sm">You need to sign in to view your workspaces.</p>
            <Link href="/login" className="mt-3 inline-block rounded bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800">
              Go to Sign in
            </Link>
          </div>
        ) : null}

        {!isUnauthorized && error ? (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="rounded border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-600">Loading your drafts...</p>
          </div>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <div className="rounded border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium">No drafts yet</h2>
            <p className="mt-1 text-sm text-zinc-600">Create or edit a template to see your draft workspaces here.</p>
          </div>
        ) : null}

        {!isLoading && !error && items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded border border-zinc-200 bg-white shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50">
                <a
                  href={getDraftEditorUrl(item.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-zinc-900">{item.name}</h3>
                      <p className="mt-1 text-xs text-zinc-500">Draft ID: {item.id}</p>
                      <p className="mt-1 text-xs text-zinc-500">Template ID: {item.templateId ?? 'N/A'}</p>
                      <p className="mt-2 text-xs font-medium text-zinc-700">Open in editor</p>
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-xs text-zinc-600 md:text-right">
                      <p>Updated: {formatDate(item.updatedAt)}</p>
                      <p>Created: {formatDate(item.createdAt)}</p>
                      <p>Last opened: {formatDate(item.lastOpenedAt)}</p>
                    </div>
                  </div>
                </a>
              </article>
            ))}

            <div className="mt-4 flex items-center justify-between rounded border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="text-zinc-600">
                Page {page} of {totalPages} ({total} drafts)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-zinc-300 px-3 py-1.5 text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="rounded border border-zinc-300 px-3 py-1.5 text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
