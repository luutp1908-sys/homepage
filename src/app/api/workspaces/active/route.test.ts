import { describe, expect, it, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

describe('GET /api/workspaces/active', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('returns null without backend verification when no workspace cookie is present', async () => {
    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/active');

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.workspaceId).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null and clears the cookie when the stored workspace is no longer accessible', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: '11111111-1111-4111-8111-111111111111' }] }),
    });

    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/active', {
      headers: {
        cookie: 'homepage_active_workspace_id=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
    });

    const response = await GET(request);
    const json = await response.json();

    expect(json.data.workspaceId).toBeNull();
    expect(response.headers.get('set-cookie')).toContain('homepage_active_workspace_id=;');
  });

  it('returns the stored workspace ID when it is still accessible', async () => {
    const validId = '11111111-1111-4111-8111-111111111111';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: validId }] }),
    });

    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/active', {
      headers: {
        cookie: `homepage_active_workspace_id=${validId}`,
      },
    });

    const response = await GET(request);
    const json = await response.json();

    expect(json.data.workspaceId).toBe(validId);
  });

  it('returns an explicit upstream error when workspace verification fails', async () => {
    const validId = '11111111-1111-4111-8111-111111111111';
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'workspace service unavailable',
    });

    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/active', {
      headers: {
        cookie: `homepage_active_workspace_id=${validId}`,
      },
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.message).toContain('workspace service unavailable');
  });
});

describe('POST /api/workspaces/active', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('rejects invalid workspace ids', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/active', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ workspaceId: 'not-a-uuid' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain('workspaceId must be a valid UUID');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns forbidden when user cannot access the workspace', async () => {
    const requestedId = '22222222-2222-4222-8222-222222222222';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: '11111111-1111-4111-8111-111111111111' }] }),
    });

    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/active', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ workspaceId: requestedId }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.message).toContain('do not have access');
  });

  it('sets active workspace cookie when workspace is accessible', async () => {
    const requestedId = '11111111-1111-4111-8111-111111111111';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: requestedId }] }),
    });

    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/active', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ workspaceId: requestedId }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.workspaceId).toBe(requestedId);
    expect(response.headers.get('set-cookie')).toContain(`homepage_active_workspace_id=${requestedId}`);
  });
});
