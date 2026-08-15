import type { FormEvent } from 'react';

type InviteMembersPanelProps = {
  inviteEmail: string;
  isInvitingMember: boolean;
  inviteError: string | null;
  inviteSuccess: string | null;
  onInviteEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function InviteMembersPanel({
  inviteEmail,
  isInvitingMember,
  inviteError,
  inviteSuccess,
  onInviteEmailChange,
  onSubmit,
}: InviteMembersPanelProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-[24px] border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
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
              onChange={(event) => onInviteEmailChange(event.target.value)}
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
  );
}
