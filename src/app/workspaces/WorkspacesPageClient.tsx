'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '../../shared/auth/getAuthHeaders';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import { CreateWorkspacePayload, fetchWorkspaceMembers, fetchWorkspaces, inviteWorkspaceMember, removeWorkspaceMember, WorkspaceSummary } from '../../shared/workspaces/workspaces';
import { DraftSortBy, DraftSortOrder, fetchUserDrafts } from '../../shared/workspaces/userDrafts';
import { useActiveWorkspace } from '../../shared/workspaces/useActiveWorkspace';
import { fetchCurrentUser } from '../../shared/auth/useAuth';
import { createWorkspaceAction, updateWorkspaceMemberRoleAction } from './actions';

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
type WorkspacesQueryData = WorkspaceSummary[];

function buildOptimisticWorkspace(payload: CreateWorkspacePayload): WorkspaceSummary {
  const trimmedName = payload.name.trim();
  const now = new Date().toISOString();

  return {
    id: `temp-${Date.now()}`,
    name: trimmedName,
    slug: trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'workspace',
    type: payload.type,
    description: payload.description?.trim() ? payload.description.trim() : null,
    avatarUrl: null,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function WorkspacesPageClientContent() {
  const queryClient = useQueryClient();
  const { workspaceId, isLoading: isActiveWorkspaceLoading, setActiveWorkspace } = useActiveWorkspace();
  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt-desc');
  const [hasCreateUnauthorized, setHasCreateUnauthorized] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionSuccess, setMemberActionSuccess] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => fetchWorkspaces(getAuthHeaders()),
  });

  const draftsQuery = useQuery({
    queryKey: ['user-drafts', workspaceId, page, sortOption],
    queryFn: () => fetchDraftPage(page, sortOption, workspaceId),
    enabled: Boolean(workspaceId),
  });

  const membersQuery = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => fetchWorkspaceMembers(workspaceId!, getAuthHeaders()),
    enabled: Boolean(workspaceId),
  });

  const items = (draftsQuery.data as UserDraftPage | undefined)?.items ?? [];
  const members = membersQuery.data ?? [];
  const currentMember = members.find((member) => member.userId === currentUserId) ?? null;
  const total = draftsQuery.data?.total ?? 0;
  const queryError = draftsQuery.error as Error | null;
  const error = queryError?.message ?? null;
  const queryUnauthorized = Boolean(error && error.includes('401'));
  const isUnauthorized = hasCreateUnauthorized || queryUnauthorized;
  const isLoading = draftsQuery.isLoading;

  const createWorkspaceMutation = useMutation({
    mutationFn: async (payload: CreateWorkspacePayload) => createWorkspaceAction(payload),
    onMutate: async (payload) => {
      setCreateError(null);
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });

      const previousWorkspaces = queryClient.getQueryData<WorkspacesQueryData>(['workspaces']) ?? [];
      const optimisticWorkspace = buildOptimisticWorkspace(payload);

      queryClient.setQueryData<WorkspacesQueryData>(['workspaces'], [optimisticWorkspace, ...previousWorkspaces]);

      return {
        previousWorkspaces,
        optimisticWorkspaceId: optimisticWorkspace.id,
      };
    },
    onSuccess: async (created, _payload, context) => {
      queryClient.setQueryData<WorkspacesQueryData>(['workspaces'], (current = []) =>
        current.map((workspace) => (workspace.id === context?.optimisticWorkspaceId ? created : workspace)),
      );
      setCreateSuccess(`Workspace "${created.name}" created successfully.`);
      setIsCreateModalOpen(false);
      await setActiveWorkspace(created.id);
      await queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err: unknown, _payload, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
      }

      const message = err instanceof Error ? err.message : 'Failed to create workspace';
      if (message.includes('401')) {
        setHasCreateUnauthorized(true);
      }
      setCreateError(message);
    },
  });

  const isCreatingWorkspace = createWorkspaceMutation.isPending;

  const inviteMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error('You need to sign in before inviting a teammate.');
      }
      if (!workspaceId) {
        throw new Error('Select a workspace before inviting a teammate.');
      }

      return inviteWorkspaceMember(workspaceId, { email }, headers);
    },
    onMutate: () => {
      setInviteError(null);
      setInviteSuccess(null);
    },
    onSuccess: () => {
      setInviteSuccess('Invitation sent successfully.');
      setInviteEmail('');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to invite teammate';
      setInviteError(message);
    },
  });

  const isInvitingMember = inviteMemberMutation.isPending;

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'ADMIN' | 'MEMBER' }) => {
      if (!workspaceId) {
        throw new Error('Select a workspace before changing a member role.');
      }

      return updateWorkspaceMemberRoleAction({ workspaceId, memberId, role });
    },
    onMutate: () => {
      setMemberActionError(null);
      setMemberActionSuccess(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      setMemberActionSuccess('Member role updated.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to update member role';
      setMemberActionError(message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error('You need to sign in before removing a member.');
      }
      if (!workspaceId) {
        throw new Error('Select a workspace before removing a member.');
      }

      return removeWorkspaceMember(workspaceId, memberId, headers);
    },
    onMutate: () => {
      setMemberActionError(null);
      setMemberActionSuccess(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      setMemberActionSuccess('Member removed from workspace.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      setMemberActionError(message);
    },
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const editorBase = (process.env.NEXT_PUBLIC_EDITOR_APP_URL || 'http://localhost:5174').replace(/\/+$/, '');
  const showUnauthorized = isUnauthorized;
  const showError = !isUnauthorized && Boolean(error);
  const showEmpty = !isLoading && !error && items.length === 0;
  const showList = !isLoading && !error && items.length > 0;
  const workspaceOptions = workspacesQuery.data ?? [];
  const activeWorkspace = workspaceOptions.find((workspace) => workspace.id === workspaceId) ?? workspaceOptions[0] ?? null;
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
    setInviteError(null);
    setInviteSuccess(null);
    setInviteEmail('');
    setPage(1);
    await setActiveWorkspace(nextWorkspaceId);
    await queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
  };

  const handleInviteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = inviteEmail.trim();

    if (!trimmedEmail) {
      setInviteError('Please enter an email address.');
      return;
    }

    await inviteMemberMutation.mutateAsync(trimmedEmail);
  };

  const canManageMembers = activeWorkspace?.type === 'TEAM' && Boolean(currentMember && ['OWNER', 'ADMIN'].includes(currentMember.role));

  const handleRoleChange = async (memberId: string, role: 'ADMIN' | 'MEMBER') => {
    await updateMemberRoleMutation.mutateAsync({ memberId, role });
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMemberMutation.mutateAsync(memberId);
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
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCurrentUserId(user?.id ?? null);
        }
      } catch {
        if (!cancelled) {
          setCurrentUserId(null);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(255,240,210,0.9),_transparent_55%),linear-gradient(135deg,_#f8fafc_0%,_#fef7ed_100%)]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white/90 p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                Workspace Studio
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Design your team’s creative hub</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">
                Organize your drafts, switch between workspaces effortlessly, and invite collaborators in a calmer, more polished workspace experience.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                className="rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={openCreateModal}
                disabled={isUnauthorized || isCreatingWorkspace}
              >
                + New workspace
              </button>

              <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 shadow-sm">
                <span className="text-zinc-500">Workspace</span>
                <select
                  className="bg-transparent font-medium text-zinc-900 outline-none"
                  value={switcherValue}
                  onChange={handleWorkspaceChange}
                  disabled={switcherDisabled}
                >
                  {workspaceOptions.length === 0 ? <option value="">No workspaces</option> : null}
                  {workspaceOptions.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 p-5 text-white shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Current workspace</p>
                  <h2 className="mt-1 text-xl font-semibold">{activeWorkspace?.name ?? 'Choose a workspace'}</h2>
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-100">
                  {activeWorkspace?.type === 'TEAM' ? 'Team' : 'Personal'}
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-300">
                {activeWorkspace?.description || 'Create or open a workspace to start shaping your next design.'}
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600">Sort drafts</p>
                  <p className="text-xs text-zinc-500">Keep your latest work in view</p>
                </div>
              </div>
              <label className="mt-4 block text-sm font-medium text-zinc-700">
                <select
                  className="mt-2 block w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none"
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
        </section>

        {activeWorkspace?.type === 'TEAM' ? (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <form onSubmit={handleInviteSubmit} className="rounded-[24px] border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Invite a teammate</p>
                  <p className="mt-1 text-sm text-zinc-600">Bring collaborators into this workspace and keep everyone aligned.</p>
                </div>
                <div className="flex flex-1 flex-col gap-3 lg:max-w-xl lg:flex-row">
                  <label className="flex-1 text-sm font-medium text-zinc-700">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="name@example.com"
                      className="mt-1 block w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:bg-white"
                      disabled={isInvitingMember}
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isInvitingMember}
                  >
                    {isInvitingMember ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              </div>
              {inviteError ? <p className="mt-3 text-sm text-red-600">{inviteError}</p> : null}
              {inviteSuccess ? <p className="mt-3 text-sm text-emerald-600">{inviteSuccess}</p> : null}
            </form>

            <section className="rounded-[24px] border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Members</p>
                  <p className="mt-1 text-sm text-zinc-600">See everyone in this workspace.</p>
                </div>
                <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-600">
                  {members.length}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {membersQuery.isLoading ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">Loading members...</div>
                ) : null}

                {membersQuery.error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Unable to load members right now.</div>
                ) : null}

                {!membersQuery.isLoading && !membersQuery.error && members.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-600">No members found yet.</div>
                ) : null}

                {memberActionError ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{memberActionError}</p> : null}
                {memberActionSuccess ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{memberActionSuccess}</p> : null}

                {members.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900">{member.name}</p>
                        <p className="truncate text-sm text-zinc-600">{member.email}</p>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{member.role}</p>
                      </div>
                    </div>

                    {canManageMembers && member.role !== 'OWNER' ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="text-xs font-medium text-zinc-600">
                          <span className="sr-only">Role</span>
                          <select
                            className="rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 outline-none"
                            value={member.role}
                            onChange={(event) => handleRoleChange(member.id, event.target.value as 'ADMIN' | 'MEMBER')}
                            disabled={updateMemberRoleMutation.isPending || removeMemberMutation.isPending}
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          className="rounded-xl border border-red-200 px-2.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removeMemberMutation.isPending || updateMemberRoleMutation.isPending}
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {createSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{createSuccess}</div>
        ) : null}

        {showUnauthorized ? (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 text-amber-800 shadow-sm">
            <p className="text-sm">You need to sign in to view your workspaces.</p>
            <Link href="/login" className="mt-3 inline-flex rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
              Go to Sign in
            </Link>
          </div>
        ) : null}

        {showError ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[24px] border border-zinc-200 bg-white/80 p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-zinc-700">Loading your drafts...</p>
          </div>
        ) : null}

        {showEmpty ? (
          <div className="rounded-[24px] border border-zinc-200 bg-white/80 p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-2xl">✦</div>
            <h2 className="mt-4 text-lg font-semibold text-zinc-900">No drafts yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
              Create or edit a template to start collecting polished draft concepts in this workspace.
            </p>
          </div>
        ) : null}

        {showList ? (
          <section className="rounded-[24px] border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Recent drafts</h2>
                <p className="text-sm text-zinc-600">Your latest work, organized by the selected workspace.</p>
              </div>
              <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-600">
                {total} drafts
              </div>
            </div>

            <div className="space-y-3">
              {items.map(renderDraftCard)}

              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-zinc-600">
                  Page {page} of {totalPages} ({total} drafts)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>
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
