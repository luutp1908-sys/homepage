import { NextResponse } from 'next/server';

function buildWorkspaceMembersUrl(request: Request, workspaceId: string) {
  const base = process.env.BE_URL ?? 'http://localhost:4000';
  return `${base.replace(/\/+$/, '')}/api/v1/workspace/${workspaceId}/members`;
}

async function buildFetchOptions(request: Request): Promise<RequestInit> {
  const headers: HeadersInit = {
    accept: 'application/json',
  };

  const auth = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');
  if (auth) headers['authorization'] = auth;
  if (cookie) headers['cookie'] = cookie;

  return {
    method: 'GET',
    headers,
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const target = buildWorkspaceMembersUrl(request, workspaceId);
    const options = await buildFetchOptions(request);
    const response = await fetch(target, options);
    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();

    if (!text) {
      return new NextResponse(null, { status: response.status });
    }

    if (contentType.includes('application/json')) {
      return NextResponse.json(JSON.parse(text), { status: response.status });
    }

    return new NextResponse(text, { status: response.status, headers: { 'content-type': contentType || 'text/plain' } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown error' }, { status: 500 });
  }
}
