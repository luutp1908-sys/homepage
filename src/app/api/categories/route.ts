import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createErrorResponse, validateJsonBody } from '../../../shared/api/validation';

async function proxyCategory(request: Request, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') {
  try {
    const beBase = process.env.BE_URL ?? 'http://localhost:4000';

    // preserve querystring
    const reqUrl = new URL(request.url);
    const qs = reqUrl.search;

    const target = `${beBase.replace(/\/+$/, '')}/api/v1/category${qs}`;

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

    let bodyPayload: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      const validation = await validateJsonBody(request);
      if ('error' in validation) {
        return validation.error;
      }

      bodyPayload = validation.body;
    }

    const resp = await fetch(target, {
      method,
      headers,
      body: bodyPayload,
    });

    const responseContentType = resp.headers.get('content-type') ?? '';
    const body = responseContentType.includes('application/json') ? await resp.json() : await resp.text();

    if (resp.ok && method !== 'GET') {
      revalidateTag('categories', 'max');
    }

    return NextResponse.json(body, { status: resp.status });
  } catch (err: any) {
    return createErrorResponse(500, err?.message ?? 'unknown error');
  }
}

export async function GET(request: Request) {
  return proxyCategory(request, 'GET');
}

export async function POST(request: Request) {
  return proxyCategory(request, 'POST');
}

export async function PUT(request: Request) {
  return proxyCategory(request, 'PUT');
}

export async function PATCH(request: Request) {
  return proxyCategory(request, 'PATCH');
}

export async function DELETE(request: Request) {
  return proxyCategory(request, 'DELETE');
}
