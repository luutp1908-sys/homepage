import { ACTIVE_WORKSPACE_BROADCAST_KEY, ACTIVE_WORKSPACE_STORAGE_KEY } from './constants';

type ActiveWorkspaceBroadcastPayload = {
  workspaceId: string | null;
  timestamp: number;
};

function hasWindow() {
  return typeof window !== 'undefined';
}

export function readStoredActiveWorkspaceId() {
  if (!hasWindow()) return null;
  return window.sessionStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
}

export function persistActiveWorkspaceSession(workspaceId: string | null) {
  if (!hasWindow()) return;

  if (workspaceId && workspaceId.length > 0) {
    window.sessionStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, workspaceId);
    return;
  }

  window.sessionStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
}

export function broadcastActiveWorkspaceChange(workspaceId: string | null) {
  if (!hasWindow()) return;

  const payload: ActiveWorkspaceBroadcastPayload = {
    workspaceId: workspaceId && workspaceId.length > 0 ? workspaceId : null,
    timestamp: Date.now(),
  };

  window.localStorage.setItem(ACTIVE_WORKSPACE_BROADCAST_KEY, JSON.stringify(payload));
  window.localStorage.removeItem(ACTIVE_WORKSPACE_BROADCAST_KEY);
}

export function parseActiveWorkspaceBroadcast(rawPayload: string) {
  try {
    const parsed = JSON.parse(rawPayload) as ActiveWorkspaceBroadcastPayload;

    if (parsed.workspaceId === null) {
      return null;
    }

    if (typeof parsed.workspaceId === 'string' && parsed.workspaceId.length > 0) {
      return parsed.workspaceId;
    }

    return undefined;
  } catch {
    return undefined;
  }
}
