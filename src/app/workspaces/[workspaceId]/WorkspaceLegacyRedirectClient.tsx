'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../shared/auth/getAuthHeaders';

type WorkspaceLegacyRedirectClientProps = {
  workspaceId: string;
};

export default function WorkspaceLegacyRedirectClient({ workspaceId }: WorkspaceLegacyRedirectClientProps) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Switching workspace...');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const response = await fetch('/api/workspaces/active', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(getAuthHeaders() || {}),
          },
          body: JSON.stringify({ workspaceId }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.replace('/login');
            return;
          }

          const text = await response.text().catch(() => '');
          throw new Error(text || `Failed to switch workspace (${response.status})`);
        }

        if (!cancelled) {
          router.replace('/workspaces');
        }
      } catch (err: any) {
        if (cancelled) return;
        const message = typeof err?.message === 'string' ? err.message : 'Unable to switch workspace';
        setStatusMessage(message);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, workspaceId]);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50">
      <main className="w-full max-w-5xl px-6 py-8">
        <div className="rounded border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">{statusMessage}</p>
        </div>
      </main>
    </div>
  );
}
