'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

type UpdateProfilePayload = {
  displayName: string;
  avatarUrl: string | null;
};

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
};

function getBackendUrl(path: string) {
  const beBase = process.env.BE_URL ?? 'http://localhost:4000';
  return `${beBase.replace(/\/+$/, '')}${path}`;
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

async function readJsonBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiEnvelope<any> | any;
  } catch {
    return null;
  }
}

async function getServerAuthHeaders() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  const cookieHeader = cookieStore.toString();
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

export async function updateProfileAction(payload: UpdateProfilePayload) {
  const headers = await getServerAuthHeaders();
  const response = await fetch(getBackendUrl('/api/v1/user/me'), {
    method: 'PATCH',
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      displayName: payload.displayName,
      avatarUrl: payload.avatarUrl,
    }),
    cache: 'no-store',
  });

  const parsed = await readJsonBody(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(parsed, `Failed to update profile (${response.status})`));
  }

  revalidatePath('/account');
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return (parsed as ApiEnvelope<any>).data ?? null;
  }

  return parsed;
}

export async function changePasswordAction(payload: ChangePasswordPayload) {
  const headers = await getServerAuthHeaders();
  const response = await fetch(getBackendUrl('/api/v1/user/me/password'), {
    method: 'PATCH',
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const parsed = await readJsonBody(response);

  if (!response.ok) {
    throw new Error(readErrorMessage(parsed, `Failed to change password (${response.status})`));
  }

  revalidatePath('/account');
}