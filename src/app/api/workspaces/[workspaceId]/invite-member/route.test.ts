import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('invite-member route validation', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('rejects invalid workspace ids', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/not-a-uuid/invite-member', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'person@example.com' }),
    });

    const response = await POST(request, { params: Promise.resolve({ workspaceId: 'not-a-uuid' }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain('workspaceId must be a valid UUID');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON bodies', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/workspaces/11111111-1111-4111-8111-111111111111/invite-member', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: '{invalid json',
    });

    const response = await POST(request, { params: Promise.resolve({ workspaceId: '11111111-1111-4111-8111-111111111111' }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain('valid JSON');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
