'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CreateWorkspacePayload, WorkspaceType } from '../../shared/workspaces/workspaces';

type CreateWorkspaceModalProps = {
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateWorkspacePayload) => Promise<void>;
};

export default function CreateWorkspaceModal(props: CreateWorkspaceModalProps) {
  const { open, isSubmitting, errorMessage, onClose, onSubmit } = props;

  const [name, setName] = useState('');
  const [type, setType] = useState<WorkspaceType>('PERSONAL');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setType('PERSONAL');
    setDescription('');
    setLocalError(null);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setLocalError('Workspace name is required.');
      return;
    }

    await onSubmit({
      name: trimmedName,
      type,
      description: description.trim().length > 0 ? description.trim() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded border border-zinc-200 bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-zinc-900">Create workspace</h2>
        <p className="mt-1 text-sm text-zinc-600">Create a new workspace for your drafts and team collaboration.</p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-zinc-700">
            Workspace name
            <input
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={160}
              disabled={isSubmitting}
              placeholder="Marketing Team"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Type
            <select
              className="mt-1 block w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value as WorkspaceType)}
              disabled={isSubmitting}
            >
              <option value="PERSONAL">Personal</option>
              <option value="TEAM">Team</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Description (optional)
            <textarea
              className="mt-1 block min-h-[80px] w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              disabled={isSubmitting}
              placeholder="What this workspace is used for"
            />
          </label>

          {localError ? <p className="text-sm text-red-700">{localError}</p> : null}
          {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
