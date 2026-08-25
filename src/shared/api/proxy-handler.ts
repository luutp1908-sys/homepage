import { createErrorResponse, validateJsonBody } from './validation';
import { buildBackendTarget, buildForwardHeaders, HttpMethod, toNextResponse } from './fetch-utils';
import { NextResponse } from 'next/server';

type ForwardProxyOptions = {
  request: Request;
  method: HttpMethod;
  backendPath: string;
  validateBody?: boolean;
};

function methodHasBody(method: HttpMethod) {
  return method !== 'GET' && method !== 'DELETE' && method !== 'HEAD';
}

export async function forwardProxyRequest(options: ForwardProxyOptions): Promise<NextResponse> {
  const { request, method, backendPath, validateBody = true } = options;

  try {
    const headers = buildForwardHeaders(request);
    let body: string | undefined;

    if (methodHasBody(method)) {
      if (validateBody) {
        const validation = await validateJsonBody(request);
        if ('error' in validation) {
          return validation.error;
        }

        body = validation.body;
      } else {
        body = await request.text();
      }

      if (body) {
        headers['content-type'] = request.headers.get('content-type') ?? 'application/json';
      }
    }

    const target = buildBackendTarget(request, backendPath);
    const response = await fetch(target, {
      method,
      headers,
      body,
    });

    return toNextResponse(response);
  } catch (err: any) {
    return createErrorResponse(500, err?.message ?? 'unknown error');
  }
}
