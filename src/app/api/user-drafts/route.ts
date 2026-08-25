import { NextResponse } from 'next/server';
import { createErrorResponse } from '../../../shared/api/validation';

function parsePositiveInteger(value: string | null, fallback: number, name: string) {
  if (value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: createErrorResponse(400, `${name} must be a positive integer`) };
  }
  return parsed;
}

function parseSortValue(value: string | null, allowed: string[], fallback: string, name: string) {
  if (value === null || value === '') return fallback;
  if (!allowed.includes(value)) {
    return { error: createErrorResponse(400, `${name} must be one of: ${allowed.join(', ')}`) };
  }
  return value;
}

export async function GET(request: Request) {
  try {
    const beBase = process.env.BE_URL ?? 'http://localhost:4000';

    const reqUrl = new URL(request.url);
    const page = parsePositiveInteger(reqUrl.searchParams.get('page'), 1, 'page');
    if (typeof page === 'object' && 'error' in page) return page.error;

    const pageSize = parsePositiveInteger(reqUrl.searchParams.get('pageSize'), 10, 'pageSize');
    if (typeof pageSize === 'object' && 'error' in pageSize) return pageSize.error;

    const sortBy = parseSortValue(reqUrl.searchParams.get('sortBy'), ['updatedAt', 'createdAt'], 'updatedAt', 'sortBy');
    if (typeof sortBy === 'object' && 'error' in sortBy) return sortBy.error;

    const sortOrder = parseSortValue(reqUrl.searchParams.get('sortOrder'), ['asc', 'desc'], 'desc', 'sortOrder');
    if (typeof sortOrder === 'object' && 'error' in sortOrder) return sortOrder.error;

    const query = new URLSearchParams(reqUrl.search);
    query.set('page', String(page));
    query.set('pageSize', String(pageSize));
    query.set('sortBy', String(sortBy));
    query.set('sortOrder', String(sortOrder));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const target = `${beBase.replace(/\/+$/, '')}/api/v1/user-draft${qs}`;

    const headers: Record<string, string> = {
      accept: 'application/json',
    };

    const auth = request.headers.get('authorization');
    const cookie = request.headers.get('cookie');
    if (auth) headers.authorization = auth;
    if (cookie) headers.cookie = cookie;

    const resp = await fetch(target, { method: 'GET', headers });
    const contentType = resp.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json') ? await resp.json() : await resp.text();

    return NextResponse.json(body, { status: resp.status });
  } catch (err: any) {
    return createErrorResponse(500, err?.message ?? 'unknown error');
  }
}
