import { NextResponse } from 'next/server';
import { createErrorResponse, validateJsonBody, validateUuidPathParam } from '../../../../../shared/api/validation';

function buildInviteUrl(request: Request, workspaceId: string) {
  const base = process.env.BE_URL ?? 'http://localhost:4000';
  return `${base.replace(/\/+$/, '')}/api/v1/workspace/${workspaceId}/invite-member`;
}

function copyHeader(request: Request, headers: Record<string, string>, name: string) {
  const value = request.headers.get(name);
  if (value) {
    headers[name] = value;
  }
}

async function buildFetchOptions(request: Request, body?: string): Promise<RequestInit> {
  const headers: HeadersInit = {
    accept: 'application/json',
  };

  copyHeader(request, headers, 'authorization');
  copyHeader(request, headers, 'cookie');

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

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const workspaceIdValidation = validateUuidPathParam(workspaceId, 'workspaceId');
  if ('error' in workspaceIdValidation) {
    return workspaceIdValidation.error;
  }

  const validation = await validateJsonBody(request);
  if ('error' in validation) {
    return validation.error;
  }

  const target = buildInviteUrl(request, workspaceId);
  const options = await buildFetchOptions(request, validation.body);
  const response = await fetch(target, options);

  return toNextResponse(response);
}
