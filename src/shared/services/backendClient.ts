import 'server-only';

import { cookies } from 'next/headers';

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
};

export function getBackendUrl(path: string) {
  const beBase = process.env.BE_URL ?? 'http://localhost:4000';
  return `${beBase.replace(/\/+$/, '')}${path}`;
}

export async function getServerAuthHeaders() {
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

export function parseJsonSafely(text: string) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function resolveEnvelopeData<T>(payload: ApiEnvelope<T> | T) {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    const data = (payload as ApiEnvelope<T>).data;
    if (typeof data !== 'undefined') {
      return data;
    }
  }

  return payload as T;
}

export function readEnvelopeError(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}
