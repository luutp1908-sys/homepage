import { forwardProxyRequest } from '../../../shared/api/proxy-handler';

export async function GET(request: Request) {
    return forwardProxyRequest({
        request,
        method: 'GET',
        backendPath: '/api/v1/workspace',
    });
}

export async function POST(request: Request) {
    return forwardProxyRequest({
        request,
        method: 'POST',
        backendPath: '/api/v1/workspace',
    });
}
