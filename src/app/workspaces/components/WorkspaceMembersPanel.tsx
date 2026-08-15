import type { WorkspaceMemberSummary } from '../../../shared/workspaces/workspaces';

type MembersQueryState = {
  isLoading: boolean;
  error: unknown;
};

type WorkspaceMembersPanelProps = {
  members: WorkspaceMemberSummary[];
  membersQuery: MembersQueryState;
  memberActionError: string | null;
  memberActionSuccess: string | null;
  canManageMembers: boolean;
  isUpdatingRole: boolean;
  isRemovingMember: boolean;
  onRoleChange: (memberId: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
};

export default function WorkspaceMembersPanel({
  members,
  membersQuery,
  memberActionError,
  memberActionSuccess,
  canManageMembers,
  isUpdatingRole,
  isRemovingMember,
  onRoleChange,
  onRemoveMember,
}: WorkspaceMembersPanelProps) {
  return (
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
                    onChange={(event) => {
                      void onRoleChange(member.id, event.target.value as 'ADMIN' | 'MEMBER');
                    }}
                    disabled={isUpdatingRole || isRemovingMember}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="rounded-xl border border-red-200 px-2.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  onClick={() => {
                    void onRemoveMember(member.id);
                  }}
                  disabled={isRemovingMember || isUpdatingRole}
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
