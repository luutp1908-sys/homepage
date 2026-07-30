import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const beBase = process.env.BE_URL ?? 'http://localhost:4000';
    const target = `${beBase.replace(/\/+$/, '')}/api/v1/user/me/password`;

    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
    };

    const auth = request.headers.get('authorization');
    const cookie = request.headers.get('cookie');
    if (auth) headers.authorization = auth;
    if (cookie) headers.cookie = cookie;

    const body = await request.text();
    const resp = await fetch(target, {
      method: 'PATCH',
      headers,
      body,
    });

    const contentType = resp.headers.get('content-type') ?? '';
    const text = await resp.text();

    if (!text) {
      return new NextResponse(null, { status: resp.status });
    }

    if (contentType.includes('application/json')) {
      return NextResponse.json(JSON.parse(text), { status: resp.status });
    }

    return new NextResponse(text, { status: resp.status, headers: { 'content-type': contentType || 'text/plain' } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown error' }, { status: 500 });
  }
}
