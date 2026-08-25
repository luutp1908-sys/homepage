import { NextResponse } from 'next/server';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export function getBackendBaseUrl() {
  return (process.env.BE_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
}

export function getHomepageBaseUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

export function buildBackendTarget(request: Request, backendPath: string) {
  const search = new URL(request.url).search;
  return `${getBackendBaseUrl()}${backendPath}${search}`;
}

export function buildHomepageApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getHomepageBaseUrl()}${normalizedPath}`;
}

export function buildForwardHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  const auth = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');
  if (auth) headers.authorization = auth;
  if (cookie) headers.cookie = cookie;

  return headers;
}

export async function toNextResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();

  if (!text) {
    return new NextResponse(null, { status: response.status });
  }

  if (contentType.includes('application/json')) {
    return NextResponse.json(JSON.parse(text), { status: response.status });
  }

  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': contentType || 'text/plain',
    },
  });
}
