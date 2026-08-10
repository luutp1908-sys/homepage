import { cookies } from 'next/headers';
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

function redirectToLogin(nextPath: string): never {
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}

export async function requireAuthenticated(nextPath: string): Promise<AuthenticatedUser> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  if (!accessToken && !cookieHeader) {
    redirectToLogin(nextPath);
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
      redirectToLogin(nextPath);
    }

    const payload = (await response.json()) as ApiEnvelope<AuthenticatedUser>;
    const user = payload?.data;

    if (!user?.id) {
      redirectToLogin(nextPath);
    }

    return user;
  } catch {
    redirectToLogin(nextPath);
  }
}