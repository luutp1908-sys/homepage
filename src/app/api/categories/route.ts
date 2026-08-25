import { revalidateTag } from 'next/cache';
import { forwardProxyRequest } from '../../../shared/api/proxy-handler';

async function proxyCategory(request: Request, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') {
  const response = await forwardProxyRequest({
    request,
    method,
    backendPath: '/api/v1/category',
  });

  if (response.ok && method !== 'GET') {
      revalidateTag('categories', 'max');
  }

  return response;
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
