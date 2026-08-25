import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('workspace member mutation route validation', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('rejects invalid workspace or member ids on PATCH', async () => {
    const { PATCH } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/not-a-uuid/members/not-a-member', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ role: 'ADMIN' }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ workspaceId: 'not-a-uuid', memberId: 'not-a-member' }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain('workspaceId must be a valid UUID');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
