import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('user-drafts route validation', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('rejects invalid page query parameters', async () => {
    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/user-drafts?page=abc');

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain('page must be a positive integer');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
