import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('workspaces route validation', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('rejects invalid JSON bodies on POST', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/workspaces', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: '{invalid json',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain('valid JSON');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
