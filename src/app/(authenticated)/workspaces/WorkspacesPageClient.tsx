'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '../../../shared/auth/getAuthHeaders';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import { CreateWorkspacePayload, fetchWorkspaceMembers, fetchWorkspaces, inviteWorkspaceMember, removeWorkspaceMember, WorkspaceSummary } from '../../../shared/workspaces/workspaces';
import { DraftSortBy, DraftSortOrder, fetchUserDrafts } from '../../../shared/workspaces/userDrafts';
import { useActiveWorkspace } from '../../../shared/workspaces/useActiveWorkspace';
import { useAuthState } from '../../../shared/auth/useAuthState';
import { createWorkspaceAction, updateWorkspaceMemberRoleAction } from './actions';
import WorkspaceHeader from './components/WorkspaceHeader';
import WorkspaceOverviewCard from './components/WorkspaceOverviewCard';
import DraftSortPanel from './components/DraftSortPanel';
import InviteMembersPanel from './components/InviteMembersPanel';
import WorkspaceMembersPanel from './components/WorkspaceMembersPanel';
import DraftsSection from './components/DraftsSection';
import UnauthorizedState from './components/UnauthorizedState';
import ErrorAlert from './components/ErrorAlert';
import EmptyState from './components/EmptyState';

type SortOption = 'updatedAt-desc' | 'createdAt-desc' | 'createdAt-asc';

const PAGE_SIZE = 10;

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
  const { user: currentUser } = useAuthState();
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
  const currentUserId = currentUser?.id ?? null;
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
        <WorkspaceHeader
          onCreateWorkspace={openCreateModal}
          isCreatingWorkspace={isCreatingWorkspace}
          isUnauthorized={isUnauthorized}
          workspaceOptions={workspaceOptions}
          switcherValue={switcherValue}
          switcherDisabled={switcherDisabled}
          onWorkspaceChange={handleWorkspaceChange}
        />

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <WorkspaceOverviewCard activeWorkspace={activeWorkspace} />
          <DraftSortPanel sortOption={sortOption} onSortChange={handleSortChange} />
        </div>

        {activeWorkspace?.type === 'TEAM' ? (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <InviteMembersPanel
              inviteEmail={inviteEmail}
              isInvitingMember={isInvitingMember}
              inviteError={inviteError}
              inviteSuccess={inviteSuccess}
              onInviteEmailChange={(value) => setInviteEmail(value)}
              onSubmit={handleInviteSubmit}
            />

            <WorkspaceMembersPanel
              members={members}
              membersQuery={membersQuery}
              memberActionError={memberActionError}
              memberActionSuccess={memberActionSuccess}
              canManageMembers={canManageMembers}
              isUpdatingRole={updateMemberRoleMutation.isPending}
              isRemovingMember={removeMemberMutation.isPending}
              onRoleChange={handleRoleChange}
              onRemoveMember={handleRemoveMember}
            />
          </div>
        ) : null}

        {createSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{createSuccess}</div>
        ) : null}

        {showUnauthorized ? <UnauthorizedState /> : null}
        {showError ? <ErrorAlert message={error ?? 'Something went wrong.'} /> : null}
        {isLoading ? <div className="rounded-[24px] border border-zinc-200 bg-white/80 p-8 text-center shadow-sm"><p className="text-sm font-medium text-zinc-700">Loading your drafts...</p></div> : null}
        {showEmpty ? <EmptyState /> : null}

        {showList ? (
          <DraftsSection
            items={items}
            page={page}
            total={total}
            totalPages={totalPages}
            onPreviousPage={() => setPage((prev) => Math.max(1, prev - 1))}
            onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            getDraftEditorUrl={getDraftEditorUrl}
          />
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

export default WorkspacesPageClientContent;
