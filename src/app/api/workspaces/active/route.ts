import { NextResponse } from 'next/server';

const ACTIVE_WORKSPACE_COOKIE = 'homepage_active_workspace_id';

type WorkspaceAccessResult =
  | { ok: true; workspaceIds: string[] }
  | { ok: false; status: number; message: string };

function getAllowedOrigins() {
  const configured = [process.env.NEXT_PUBLIC_EDITOR_APP_URL, process.env.EDITOR_APP_URL]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return value;
      }
    });

  return [...new Set([...configured, 'http://localhost:5174'])];
}

function withCors(request: Request, response: NextResponse) {
  const origin = request.headers.get('origin');
  if (!origin) return response;

  const allowedOrigins = getAllowedOrigins();
  if (!allowedOrigins.includes(origin)) return response;

  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Vary', 'Origin');
  return response;
}

function getBackendBase() {
  return (process.env.BE_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
}

function buildForwardHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = { accept: 'application/json' };

  const auth = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');
  if (auth) headers.authorization = auth;
  if (cookie) headers.cookie = cookie;

  return headers;
}

function extractWorkspaceIds(payload: any): string[] {
  const raw = payload?.data ?? payload;
  const items = Array.isArray(raw) ? raw : [];
  return items.map((item: any) => String(item?.id ?? '')).filter((id: string) => id.length > 0);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function errorResponse(status: number, message: string) {
  return NextResponse.json(
    {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

function parseWorkspaceIdFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookiePairs = cookieHeader.split(';').map((part) => part.trim());
  const match = cookiePairs.find((pair) => pair.startsWith(`${ACTIVE_WORKSPACE_COOKIE}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

export async function OPTIONS(request: Request) {
  return withCors(request, new NextResponse(null, { status: 204 }));
}

async function getAccessibleWorkspaceIds(request: Request): Promise<WorkspaceAccessResult> {
  try {
    const resp = await fetch(`${getBackendBase()}/api/v1/workspace`, {
      method: 'GET',
      headers: buildForwardHeaders(request),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return {
        ok: false,
        status: resp.status,
        message: text || `Failed to verify workspace access (${resp.status})`,
      };
    }

    const payload = await resp.json().catch(() => ({}));
    return { ok: true, workspaceIds: extractWorkspaceIds(payload) };
  } catch {
    return {
      ok: false,
      status: 502,
      message: 'Failed to verify workspace access',
    };
  }
}

export async function GET(request: Request) {
  const value = parseWorkspaceIdFromCookie(request);

  if (!value || !isUuid(value)) {
    const response = NextResponse.json({
      success: true,
      data: { workspaceId: null },
      timestamp: new Date().toISOString(),
    });

    if (value) {
      response.cookies.delete(ACTIVE_WORKSPACE_COOKIE);
    }

    return withCors(request, response);
  }

  const access = await getAccessibleWorkspaceIds(request);
  if (!access.ok) {
    return withCors(request, errorResponse(access.status, access.message));
  }

  const isStoredValueValid = access.workspaceIds.includes(value);

  const response = NextResponse.json(
    {
      success: true,
      data: { workspaceId: isStoredValueValid ? value : null },
      timestamp: new Date().toISOString(),
    },
  );

  if (!isStoredValueValid) {
    response.cookies.delete(ACTIVE_WORKSPACE_COOKIE);
  }

  return withCors(request, response);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = typeof body?.workspaceId === 'string' ? body.workspaceId : '';

    if (!workspaceId || !isUuid(workspaceId)) {
      return withCors(request, errorResponse(400, 'workspaceId must be a valid UUID'));
    }

    const access = await getAccessibleWorkspaceIds(request);
    if (!access.ok) {
      return withCors(request, errorResponse(access.status, access.message));
    }

    const hasAccess = access.workspaceIds.includes(workspaceId);

    if (!hasAccess) {
      return withCors(request, errorResponse(403, 'You do not have access to this workspace'));
    }

    const response = NextResponse.json({
      success: true,
      data: { workspaceId },
      timestamp: new Date().toISOString(),
    });

    response.cookies.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return withCors(request, response);
  } catch (err: any) {
    return withCors(request, errorResponse(500, err?.message ?? 'Unexpected error'));
  }
}
