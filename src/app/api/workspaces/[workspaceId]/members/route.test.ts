import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('workspace members route validation', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('rejects invalid workspace ids', async () => {
    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/not-a-uuid/members');

    const response = await GET(request, { params: Promise.resolve({ workspaceId: 'not-a-uuid' }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain('workspaceId must be a valid UUID');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
