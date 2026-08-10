import { NextResponse } from 'next/server';

function hasAuthCredentials(request: Request) {
  return Boolean(request.headers.get('authorization') || request.headers.get('cookie'));
}

async function forwardUserRequest(request: Request, targetPath: string) {
  if (!hasAuthCredentials(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const beBase = process.env.BE_URL ?? 'http://localhost:4000';
  const reqUrl = new URL(request.url);
  const qs = reqUrl.search;
  const target = `${beBase.replace(/\/+$/, '')}/api/v1/user/${targetPath}${qs}`;

  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  const auth = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');
  if (auth) headers.authorization = auth;
  if (cookie) headers.cookie = cookie;

  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();
  if (body) {
    headers['content-type'] = request.headers.get('content-type') ?? 'application/json';
  }

  try {
    const resp = await fetch(target, { method: request.method, headers, body });

    const contentType = resp.headers.get('content-type') ?? '';
    const text = await resp.text();

    if (!text) {
      return new NextResponse(null, { status: resp.status });
    }

    if (contentType.includes('application/json')) {
      return NextResponse.json(JSON.parse(text), { status: resp.status });
    }

    return new NextResponse(text, {
      status: resp.status,
      headers: { 'content-type': contentType || 'text/plain' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to proxy user request' },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  return forwardUserRequest(request, 'me');
}

export async function PATCH(request: Request) {
  return forwardUserRequest(request, 'me');
}
