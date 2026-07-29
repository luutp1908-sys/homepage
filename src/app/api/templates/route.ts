import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const beBase = process.env.BE_URL ?? 'http://localhost:4000';

    // preserve querystring
    const reqUrl = new URL(request.url);
    const qs = reqUrl.search;

    const target = `${beBase}/api/v1/template${qs}`;

    const headers: Record<string, string> = {
      accept: 'application/json',
    };

    // forward auth/cookie if present
    const auth = request.headers.get('authorization');
    const cookie = request.headers.get('cookie');
    if (auth) headers.authorization = auth;
    if (cookie) headers.cookie = cookie;

    const resp = await fetch(target, { method: 'GET', headers });

    const contentType = resp.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json') ? await resp.json() : await resp.text();

    return NextResponse.json(body, { status: resp.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown error' }, { status: 500 });
  }
}
