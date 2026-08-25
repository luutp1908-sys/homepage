import { NextResponse } from 'next/server';
import { createErrorResponse, validateJsonBody } from '../../../shared/api/validation';

function buildWorkspaceUrl(request: Request) {
    const base = process.env.BE_URL ?? 'http://localhost:4000';
    const search = new URL(request.url).search;

    return `${base.replace(/\/+$/, '')}/api/v1/workspace${search}`;
}

function copyHeader(request: Request, headers: Record<string, string>, name: string) {
    const value = request.headers.get(name);

    if (value) {
        headers[name] = value;
    }
}

async function buildFetchOptions(request: Request): Promise<RequestInit | { error: NextResponse }> {
    const headers: HeadersInit = {
        accept: 'application/json',
    };

    copyHeader(request, headers, 'authorization');
    copyHeader(request, headers, 'cookie');

    if (request.method === 'GET' || request.method === 'HEAD') {
        return {
            method: request.method,
            headers,
        };
    }

    const validation = await validateJsonBody(request);
    if ('error' in validation) {
        return { error: validation.error };
    }

    const body = validation.body;
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
        return new NextResponse(null, {
            status: response.status,
        });
    }

    if (contentType.includes('application/json')) {
        return NextResponse.json(JSON.parse(text), {
            status: response.status,
        });
    }

    return new NextResponse(text, {
        status: response.status,
        headers: {
            'content-type': contentType || 'text/plain',
        },
    });
}

async function forwardWorkspaceRequest(request: Request) {
    const target = buildWorkspaceUrl(request);
    const options = await buildFetchOptions(request);

    if ('error' in options) {
        return options.error;
    }

    const response = await fetch(target, options);

    return toNextResponse(response);
}

export async function GET(request: Request) {
  return forwardWorkspaceRequest(request);
}

export async function POST(request: Request) {
  return forwardWorkspaceRequest(request);
}
