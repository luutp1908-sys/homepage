import { NextResponse } from 'next/server';

function buildMemberUrl(request: Request, workspaceId: string, memberId: string) {
  const base = process.env.BE_URL ?? 'http://localhost:4000';
  return `${base.replace(/\/+$/, '')}/api/v1/workspace/${workspaceId}/members/${memberId}`;
}

function copyHeader(request: Request, headers: Record<string, string>, name: string) {
  const value = request.headers.get(name);
  if (value) {
    headers[name] = value;
  }
}

async function buildFetchOptions(request: Request): Promise<RequestInit> {
  const headers: HeadersInit = {
    accept: 'application/json',
  };

  copyHeader(request, headers, 'authorization');
  copyHeader(request, headers, 'cookie');

  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();
  if (body) {
    headers['content-type'] = request.headers.get('content-type') ?? 'application/json';
  }

  return {
    method: request.method,
    headers,
    body,
  };
}

async function toNextResponse(response: Response) {
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

export async function PATCH(request: Request, { params }: { params: Promise<{ workspaceId: string; memberId: string }> }) {
  const { workspaceId, memberId } = await params;
  const target = buildMemberUrl(request, workspaceId, memberId);
  const options = await buildFetchOptions(request);
  const response = await fetch(target, options);
  return toNextResponse(response);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ workspaceId: string; memberId: string }> }) {
  const { workspaceId, memberId } = await params;
  const target = buildMemberUrl(request, workspaceId, memberId);
  const options = await buildFetchOptions(request);
  const response = await fetch(target, options);
  return toNextResponse(response);
}
