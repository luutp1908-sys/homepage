import { describe, expect, it, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

describe('GET /api/workspaces/active', () => {
  beforeEach(() => {
    fetchMock.mockReset();
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
});
