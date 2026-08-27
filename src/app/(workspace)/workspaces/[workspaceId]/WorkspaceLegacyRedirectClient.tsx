'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../../shared/auth/getAuthHeaders';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function readApiErrorMessage(response: Response) {
  const text = await response.text().catch(() => '');
  if (!text) return `Failed to switch workspace (${response.status})`;

  try {
    const json = JSON.parse(text) as { message?: string };
    if (typeof json?.message === 'string' && json.message.length > 0) {
      return json.message;
    }
  } catch {
    // Fall back to the raw response body when it is not JSON.
  }

  return text;
}

type WorkspaceLegacyRedirectClientProps = {
  workspaceId: string;
};

export default function WorkspaceLegacyRedirectClient({ workspaceId }: WorkspaceLegacyRedirectClientProps) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Switching workspace...');

  useEffect(() => {
    if (!workspaceId || !isUuid(workspaceId)) {
      setStatusMessage('Invalid workspace ID.');
      return;
    }

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

          if (response.status === 403) {
            throw new Error('You do not have access to this workspace.');
          }

          throw new Error(await readApiErrorMessage(response));
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
