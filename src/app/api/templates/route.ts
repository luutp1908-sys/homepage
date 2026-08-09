import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

async function proxyTemplate(request: Request, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') {
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

    const contentType = request.headers.get('content-type');
    if (contentType) headers['content-type'] = contentType;

    const bodyPayload = method === 'GET' || method === 'DELETE' ? undefined : await request.text();

    const resp = await fetch(target, {
      method,
      headers,
      body: bodyPayload,
    });

    const responseContentType = resp.headers.get('content-type') ?? '';
    const body = responseContentType.includes('application/json') ? await resp.json() : await resp.text();

    if (resp.ok && method !== 'GET') {
      revalidateTag('templates');
    }

    return NextResponse.json(body, { status: resp.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return proxyTemplate(request, 'GET');
}

export async function POST(request: Request) {
  return proxyTemplate(request, 'POST');
}

export async function PUT(request: Request) {
  return proxyTemplate(request, 'PUT');
}

export async function PATCH(request: Request) {
  return proxyTemplate(request, 'PATCH');
}

export async function DELETE(request: Request) {
  return proxyTemplate(request, 'DELETE');
}
