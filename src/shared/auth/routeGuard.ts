import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

type ApiEnvelope<T> = {
  data?: T;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
  permissions: string[];
};

function sanitizeRedirectPath(candidate: string | null | undefined): string {
  if (!candidate || !candidate.startsWith('/')) {
    return '/workspaces';
  }

  if (candidate.startsWith('//')) {
    return '/workspaces';
  }

  if (candidate.startsWith('/login')) {
    return '/workspaces';
  }

  if (candidate.includes('\n') || candidate.includes('\r')) {
    return '/workspaces';
  }

  return candidate;
}

export async function resolveCurrentNextPath(): Promise<string> {
  const requestHeaders = await headers();
  const rawPath =
    requestHeaders.get('x-invoke-path') ??
    requestHeaders.get('x-forwarded-uri') ??
    requestHeaders.get('x-pathname') ??
    '/workspaces';

  try {
    const parsed = new URL(rawPath, 'http://localhost');
    return sanitizeRedirectPath(parsed.pathname || '/workspaces');
  } catch {
    return sanitizeRedirectPath(rawPath);
  }
}

function redirectToLogin(nextPath: string): never {
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}

export async function requireAuthenticated(nextPath?: string): Promise<AuthenticatedUser> {
  const resolvedNextPath = sanitizeRedirectPath(nextPath ?? (await resolveCurrentNextPath()));
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  if (!accessToken && !cookieHeader) {
    redirectToLogin(resolvedNextPath);
  }

  const beBase = process.env.BE_URL ?? 'http://localhost:4000';
  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${beBase.replace(/\/+$/, '')}/api/v1/auth/me`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      redirectToLogin(resolvedNextPath);
    }

    const payload = (await response.json()) as ApiEnvelope<AuthenticatedUser>;
    const user = payload?.data;

    if (!user?.id) {
      redirectToLogin(resolvedNextPath);
    }

    return user;
  } catch {
    redirectToLogin(resolvedNextPath);
  }
}