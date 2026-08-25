import { NextResponse } from 'next/server';

export type ApiErrorResponse = {
  success: false;
  message: string;
  timestamp: string;
  details?: unknown;
};

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function createErrorResponse(status: number, message: string, details?: unknown) {
  const payload: ApiErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (typeof details !== 'undefined') {
    payload.details = details;
  }

  return NextResponse.json(payload, { status });
}

export function isJsonContentType(contentType: string | null) {
  return Boolean(contentType && contentType.includes('application/json'));
}

export async function validateJsonBody(request: Request) {
  const body = await request.text();

  if (!body) {
    return { body: undefined as string | undefined };
  }

  const contentType = request.headers.get('content-type');
  if (!isJsonContentType(contentType)) {
    return { body };
  }

  try {
    JSON.parse(body);
    return { body };
  } catch {
    return { error: createErrorResponse(400, 'Request body must be valid JSON') };
  }
}

export function validateUuidPathParam(value: string, name: string) {
  if (!value || !isUuid(value)) {
    return { error: createErrorResponse(400, `${name} must be a valid UUID`) };
  }

  return { value };
}
