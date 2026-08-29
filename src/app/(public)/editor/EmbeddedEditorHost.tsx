'use client';

import { Suspense } from 'react';
import type { ReactNode } from 'react';
import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthState } from '../../../shared/auth/useAuthState';

const RemoteEditor = React.lazy(() => import('editor/EditorRemoteEntry'));

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!value) return null;
  return decodeURIComponent(value.slice(name.length + 1));
}

type LoaderErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type LoaderErrorBoundaryState = {
  hasError: boolean;
};

class LoaderErrorBoundary extends React.Component<LoaderErrorBoundaryProps, LoaderErrorBoundaryState> {
  state: LoaderErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LoaderErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Keep the error visible in devtools while showing a safe UI fallback.
    console.error('Failed to load federated editor remote', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function RemoteLoadingFallback() {
  return (
    <div className="w-full rounded border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
      Loading editor...
    </div>
  );
}

function RemoteErrorFallback() {
  return (
    <div className="w-full rounded border border-red-200 bg-red-50 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-red-700">Editor unavailable</h2>
      <p className="mt-2 text-sm text-red-600">
        We could not load the editor module right now. Please refresh this page or try again in a moment.
      </p>
    </div>
  );
}

export default function EmbeddedEditorHost() {
  const { user, isLoading } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nextPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

  return (
    <div className="flex flex-1 bg-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-1 px-6 py-8">
        <LoaderErrorBoundary fallback={<RemoteErrorFallback />}>
          <Suspense fallback={<RemoteLoadingFallback />}>
            <RemoteEditor
              isEmbedded
              auth={{
                user,
                accessToken: readCookie('access_token'),
                isLoading,
              }}
              callbacks={{
                onRequestLogin: () => {
                  router.push(`/login?next=${encodeURIComponent(nextPath)}`);
                },
              }}
            />
          </Suspense>
        </LoaderErrorBoundary>
      </main>
    </div>
  );
}
