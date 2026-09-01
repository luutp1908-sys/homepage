'use client';

import { Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactQuery from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { init, loadRemote, registerRemotes } from '@module-federation/runtime';
import { useAuthState } from '../../../shared/auth/useAuthState';

const REMOTE_NAME = 'editor';

function resolveRemoteEntryUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_EDITOR_REMOTE_URL ??
    process.env.NEXT_PUBLIC_EDITOR_REMOTE_URL_PROD ??
    process.env.NEXT_PUBLIC_EDITOR_REMOTE_URL_LOCAL ??
    'http://localhost:5174';

  const trimmed = configuredUrl.replace(/\/$/, '');
  return trimmed.endsWith('/remoteEntry.js') ? trimmed : `${trimmed}/remoteEntry.js`;
}

const REMOTE_ENTRY_URL = resolveRemoteEntryUrl();

let runtimeInitialized = false;

function ensureRemoteRuntime() {
  if (runtimeInitialized) {
    return;
  }

  init({
    name: 'homepage',
    remotes: [{ name: REMOTE_NAME, entry: REMOTE_ENTRY_URL, type: 'module' }],
    shared: {
      react: {
        version: '18.3.1',
        lib: () => React,
        shareConfig: {
          singleton: false,
          eager: false,
          requiredVersion: '18.3.1',
        },
      },
      'react-dom': {
        version: '18.3.1',
        lib: () => ReactDOM,
        shareConfig: {
          singleton: false,
          eager: false,
          requiredVersion: '18.3.1',
        },
      },
      '@tanstack/react-query': {
        version: '5.101.4',
        lib: () => ReactQuery,
        shareConfig: {
          singleton: false,
          eager: false,
          requiredVersion: '5.101.4',
        },
      },
    },
  });

  // Let the host and remote keep their own React copies so the Next runtime does
  // not collide with the editor's Vite runtime when loading the remote bundle.
  registerRemotes([{ name: REMOTE_NAME, entry: REMOTE_ENTRY_URL, type: 'module' }]);
  runtimeInitialized = true;
}

type RemoteEditorComponent = React.ComponentType<any>;

function useRemoteEditor() {
  const [RemoteEditor, setRemoteEditor] = useState<RemoteEditorComponent | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let active = true;

    const loadEditor = async () => {
      try {
        ensureRemoteRuntime();

        const remoteModule = await loadRemote<{ default: RemoteEditorComponent }>(
          `${REMOTE_NAME}/EditorRemoteEntry`,
          { from: 'runtime' }
        );

        if (!active) return;

        if (!remoteModule?.default) {
          throw new Error('Editor remote did not resolve a default export');
        }

        setRemoteEditor(() => remoteModule.default);
        setError(null);
      } catch (caughtError) {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError : new Error('Failed to load federated editor remote'));
      }
    };

    void loadEditor();

    return () => {
      active = false;
    };
  }, []);

  return { RemoteEditor, error };
}

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
  const { RemoteEditor, error } = useRemoteEditor();

  const nextPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

  if (error) {
    return <RemoteErrorFallback />;
  }

  if (!RemoteEditor) {
    return <RemoteLoadingFallback />;
  }

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
