import { describe, expect, it } from 'vitest';
import { createErrorResponse, isUuid, validateJsonBody, validateUuidPathParam } from './validation';

describe('api validation helpers', () => {
  it('validates UUIDs', () => {
    expect(isUuid('11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
  });

  it('returns a standardized error response', async () => {
    const response = createErrorResponse(400, 'Bad request', { field: 'workspaceId' });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toBe('Bad request');
    expect(json.details).toEqual({ field: 'workspaceId' });
    expect(typeof json.timestamp).toBe('string');
  });

  it('rejects invalid JSON bodies', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: '{invalid json',
    });

    const validation = await validateJsonBody(request);

    expect('error' in validation).toBe(true);
    if ('error' in validation) {
      const json = await validation.error.json();
      expect(validation.error.status).toBe(400);
      expect(json.message).toContain('valid JSON');
    }
  });

  it('accepts valid JSON bodies', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'Example' }),
    });

    const validation = await validateJsonBody(request);

    expect('error' in validation).toBe(false);
    expect(validation.body).toBe(JSON.stringify({ name: 'Example' }));
  });

  it('rejects invalid UUID path params', () => {
    const validation = validateUuidPathParam('not-a-uuid', 'workspaceId');

    expect('error' in validation).toBe(true);
  });
});
