import type { WorkspaceSummary } from '../../../../shared/workspaces/workspaces';

type WorkspaceOverviewCardProps = {
  activeWorkspace: WorkspaceSummary | null;
};

export default function WorkspaceOverviewCard({ activeWorkspace }: WorkspaceOverviewCardProps) {
  return (
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
  );
}
