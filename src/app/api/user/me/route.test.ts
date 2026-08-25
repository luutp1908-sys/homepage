import { describe, expect, it } from 'vitest';

describe('user/me route', () => {
  it('returns a standardized unauthorized response when credentials are missing', async () => {
    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/user/me');

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe('Unauthorized');
  });
});
