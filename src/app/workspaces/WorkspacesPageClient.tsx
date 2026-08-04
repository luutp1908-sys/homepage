'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '../../shared/auth/getAuthHeaders';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import { CreateWorkspacePayload, createWorkspace, fetchWorkspaces } from '../../shared/workspaces/workspaces';
import { DraftSortBy, DraftSortOrder, fetchUserDrafts } from '../../shared/workspaces/userDrafts';
import { useActiveWorkspace } from '../../shared/workspaces/useActiveWorkspace';

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

async function fetchDraftPage(page: number, sortOption: SortOption, workspaceId: string | null) {
  const { sortBy, sortOrder } = resolveSort(sortOption);
  return fetchUserDrafts(
    {
      page,
      pageSize: PAGE_SIZE,
      sortBy,
      sortOrder,
      ...(workspaceId ? { workspaceId } : {}),
    },
    getAuthHeaders(),
  );
}

type UserDraftPage = Awaited<ReturnType<typeof fetchDraftPage>>;
type UserDraftItem = UserDraftPage['items'][number];

function WorkspacesPageClientContent() {
  const queryClient = useQueryClient();
  const { workspaceId, isLoading: isActiveWorkspaceLoading, setActiveWorkspace } = useActiveWorkspace();
  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt-desc');
  const [hasCreateUnauthorized, setHasCreateUnauthorized] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => fetchWorkspaces(getAuthHeaders()),
  });

  const draftsQuery = useQuery({
    queryKey: ['user-drafts', workspaceId, page, sortOption],
    queryFn: () => fetchDraftPage(page, sortOption, workspaceId),
    enabled: Boolean(workspaceId),
  });

  const items = (draftsQuery.data as UserDraftPage | undefined)?.items ?? [];
  const total = draftsQuery.data?.total ?? 0;
  const queryError = draftsQuery.error as Error | null;
  const error = queryError?.message ?? null;
  const queryUnauthorized = Boolean(error && error.includes('401'));
  const isUnauthorized = hasCreateUnauthorized || queryUnauthorized;
  const isLoading = draftsQuery.isLoading;

  const createWorkspaceMutation = useMutation({
    mutationFn: async (payload: CreateWorkspacePayload) => {
      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error('You need to sign in before creating a workspace.');
      }

      return createWorkspace(payload, headers);
    },
    onMutate: () => {
      setCreateError(null);
    },
    onSuccess: async (created) => {
      setCreateSuccess(`Workspace "${created.name}" created successfully.`);
      setIsCreateModalOpen(false);
      await setActiveWorkspace(created.id);
      await queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to create workspace';
      if (message.includes('401')) {
        setHasCreateUnauthorized(true);
      }
      setCreateError(message);
    },
  });

  const isCreatingWorkspace = createWorkspaceMutation.isPending;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const editorBase = (process.env.NEXT_PUBLIC_EDITOR_APP_URL || 'http://localhost:5174').replace(/\/+$/, '');
  const showUnauthorized = isUnauthorized;
  const showError = !isUnauthorized && Boolean(error);
  const showEmpty = !isLoading && !error && items.length === 0;
  const showList = !isLoading && !error && items.length > 0;
  const workspaceOptions = workspacesQuery.data ?? [];
  const switcherValue = workspaceId ?? '';
  const switcherDisabled = isActiveWorkspaceLoading || workspacesQuery.isLoading || isUnauthorized || workspaceOptions.length === 0;

  const getDraftEditorUrl = (draftId: string) => {
    const baseUrl = `${editorBase}/draft/${encodeURIComponent(draftId)}`;
    if (!workspaceId) return baseUrl;

    const params = new URLSearchParams({ workspaceId });
    return `${baseUrl}?${params.toString()}`;
  };

  const openCreateModal = () => {
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (!isCreatingWorkspace) {
      setIsCreateModalOpen(false);
    }
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(event.target.value as SortOption);
    setPage(1);
  };

  const submitCreateModal = async (payload: CreateWorkspacePayload) => {
    await createWorkspaceMutation.mutateAsync(payload);
  };

  const handleWorkspaceChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextWorkspaceId = event.target.value;
    if (!nextWorkspaceId || nextWorkspaceId === workspaceId) return;

    setCreateError(null);
    setCreateSuccess(null);
    setPage(1);
    await setActiveWorkspace(nextWorkspaceId);
    await queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
  };

  const renderDraftCard = (item: UserDraftItem) => (
    <article key={item.id} className="rounded border border-zinc-200 bg-white shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50">
      <a href={getDraftEditorUrl(item.id)} target="_blank" rel="noopener noreferrer" className="block cursor-pointer p-4">
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
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (isActiveWorkspaceLoading || workspaceId || workspacesQuery.isLoading) return;

    const fallbackWorkspaceId = workspacesQuery.data?.[0]?.id;
    if (!fallbackWorkspaceId) return;

    let cancelled = false;

    const run = async () => {
      try {
        await setActiveWorkspace(fallbackWorkspaceId);
        if (!cancelled) {
          await queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
        }
      } catch {
        // Keep the page usable even if setting active workspace fails.
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [isActiveWorkspaceLoading, queryClient, setActiveWorkspace, workspaceId, workspacesQuery.data, workspacesQuery.isLoading]);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50">
      <main className="w-full max-w-5xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 rounded border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Workspaces</h1>
            <p className="mt-1 text-sm text-zinc-600">Your draft templates, sorted by recent activity.</p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <button
              type="button"
              className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={openCreateModal}
              disabled={isUnauthorized || isCreatingWorkspace}
            >
              New workspace
            </button>

            <label className="text-sm font-medium text-zinc-700">
              Workspace
              <select
                className="mt-1 block w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                value={switcherValue}
                onChange={handleWorkspaceChange}
                disabled={switcherDisabled}
              >
                {workspaceOptions.length === 0 ? (
                  <option value="">No workspaces</option>
                ) : null}
                {workspaceOptions.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-zinc-700">
              Sort by
              <select
                className="mt-1 block w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                value={sortOption}
                onChange={handleSortChange}
              >
                <option value="updatedAt-desc">Last updated (newest)</option>
                <option value="createdAt-desc">Created (newest)</option>
                <option value="createdAt-asc">Created (oldest)</option>
              </select>
            </label>
          </div>
        </div>

        {createSuccess ? (
          <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{createSuccess}</div>
        ) : null}

        {showUnauthorized ? (
          <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <p className="text-sm">You need to sign in to view your workspaces.</p>
            <Link href="/login" className="mt-3 inline-block rounded bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800">
              Go to Sign in
            </Link>
          </div>
        ) : null}

        {showError ? (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="rounded border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-600">Loading your drafts...</p>
          </div>
        ) : null}

        {showEmpty ? (
          <div className="rounded border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium">No drafts yet</h2>
            <p className="mt-1 text-sm text-zinc-600">Create or edit a template to see your draft workspaces here.</p>
          </div>
        ) : null}

        {showList ? (
          <div className="space-y-3">
            {items.map(renderDraftCard)}

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

      <CreateWorkspaceModal
        open={isCreateModalOpen}
        isSubmitting={isCreatingWorkspace}
        errorMessage={createError}
        onClose={closeCreateModal}
        onSubmit={submitCreateModal}
      />
    </div>
  );
}

export default WorkspacesPageClientContent
