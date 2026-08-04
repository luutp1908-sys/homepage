'use client';

import { useEffect, useState } from 'react';
import { getAuthHeaders } from '../auth/getAuthHeaders';
import { ACTIVE_WORKSPACE_STORAGE_KEY } from './constants';

type ActiveWorkspaceApiResponse = {
  success?: boolean;
  data?: {
    workspaceId?: string | null;
  };
};

export function useActiveWorkspace() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedWorkspaceId = getStoredActiveWorkspaceId();
    if (storedWorkspaceId) {
      setWorkspaceId(storedWorkspaceId);
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      try {
        const response = await fetch('/api/workspaces/active', {
          method: 'GET',
          cache: 'no-store',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        const payload = (await response.json()) as ActiveWorkspaceApiResponse;
        const nextWorkspaceId = typeof payload?.data?.workspaceId === 'string' ? payload.data.workspaceId : null;

        if (!cancelled) {
          setWorkspaceId(nextWorkspaceId);
          if (nextWorkspaceId) {
            window.sessionStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, nextWorkspaceId);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
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

    setWorkspaceId(nextWorkspaceId);
    window.sessionStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, nextWorkspaceId);
  };

  return { workspaceId, isLoading, setActiveWorkspace };
}

export function getStoredActiveWorkspaceId() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
}
