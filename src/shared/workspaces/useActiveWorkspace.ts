'use client';

import { useEffect, useState } from 'react';
import { getAuthHeaders } from '../auth/getAuthHeaders';
import { ACTIVE_WORKSPACE_BROADCAST_KEY } from './constants';
import {
  broadcastActiveWorkspaceChange,
  parseActiveWorkspaceBroadcast,
  persistActiveWorkspaceSession,
  readStoredActiveWorkspaceId,
} from './activeWorkspaceSync';

type ActiveWorkspaceApiResponse = {
  success?: boolean;
  data?: {
    workspaceId?: string | null;
  };
};

function resolveWorkspaceIdFromPayload(payload: ActiveWorkspaceApiResponse, fallback: string | null = null) {
  const workspaceId = payload?.data?.workspaceId;
  if (typeof workspaceId === 'string') return workspaceId;
  if (workspaceId === null) return null;
  return fallback;
}

export function useActiveWorkspace() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedWorkspaceId = readStoredActiveWorkspaceId();
    if (storedWorkspaceId) {
      setWorkspaceId(storedWorkspaceId);
    }

    let cancelled = false;

    const syncFromServer = async () => {
      setIsLoading(true);

      try {
        const response = await fetch('/api/workspaces/active', {
          method: 'GET',
          cache: 'no-store',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          if ((response.status === 401 || response.status === 403) && !cancelled) {
            setWorkspaceId(null);
            persistActiveWorkspaceSession(null);
          }
          if (!cancelled) setIsLoading(false);
          return;
        }

        const payload = (await response.json()) as ActiveWorkspaceApiResponse;
        const nextWorkspaceId = resolveWorkspaceIdFromPayload(payload, null);

        if (!cancelled) {
          setWorkspaceId(nextWorkspaceId);
          persistActiveWorkspaceSession(nextWorkspaceId);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ACTIVE_WORKSPACE_BROADCAST_KEY) return;
      if (!event.newValue) return;

      const nextWorkspaceId = parseActiveWorkspaceBroadcast(event.newValue);
      if (typeof nextWorkspaceId === 'undefined') return;

      setWorkspaceId(nextWorkspaceId);
      persistActiveWorkspaceSession(nextWorkspaceId);
    };

    const handleFocus = () => {
      void syncFromServer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncFromServer();
      }
    };

    void syncFromServer();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const setActiveWorkspace = async (nextWorkspaceId: string) => {
    const response = await fetch('/api/workspaces/active', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(getAuthHeaders() || {}),
      },
      body: JSON.stringify({ workspaceId: nextWorkspaceId }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Failed to set active workspace (${response.status})`);
    }

    const payload = (await response.json().catch(() => ({}))) as ActiveWorkspaceApiResponse;
    const resolvedWorkspaceId = resolveWorkspaceIdFromPayload(payload, nextWorkspaceId);

    setWorkspaceId(resolvedWorkspaceId);
    persistActiveWorkspaceSession(resolvedWorkspaceId);
    broadcastActiveWorkspaceChange(resolvedWorkspaceId);
  };

  return { workspaceId, isLoading, setActiveWorkspace };
}

export function getStoredActiveWorkspaceId() {
  return readStoredActiveWorkspaceId();
}
