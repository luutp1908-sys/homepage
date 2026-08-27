import type { ChangeEvent } from 'react';
import type { WorkspaceSummary } from '../../../../shared/workspaces/workspaces';

type WorkspaceHeaderProps = {
  onCreateWorkspace: () => void;
  isCreatingWorkspace: boolean;
  isUnauthorized: boolean;
  workspaceOptions: WorkspaceSummary[];
  switcherValue: string;
  switcherDisabled: boolean;
  onWorkspaceChange: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export default function WorkspaceHeader({
  onCreateWorkspace,
  isCreatingWorkspace,
  isUnauthorized,
  workspaceOptions,
  switcherValue,
  switcherDisabled,
  onWorkspaceChange,
}: WorkspaceHeaderProps) {
  return (
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
            onClick={onCreateWorkspace}
            disabled={isUnauthorized || isCreatingWorkspace}
          >
            + New workspace
          </button>

          <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 shadow-sm">
            <span className="text-zinc-500">Workspace</span>
            <select
              className="bg-transparent font-medium text-zinc-900 outline-none"
              value={switcherValue}
              onChange={onWorkspaceChange}
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
    </section>
  );
}
