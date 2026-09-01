import { revalidateTag } from 'next/cache';
import { forwardProxyRequest } from '../../../shared/api/proxy-handler';

async function proxyTemplate(request: Request, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') {
  const response = await forwardProxyRequest({
    request,
    method,
    backendPath: '/api/v1/template',
  });

  if (response.ok && method !== 'GET') {
    revalidateTag('templates');
  }

  return response;
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
