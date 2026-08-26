import { describe, expect, it } from 'vitest';
import { resolveNextPath } from './nextPath';

describe('resolveNextPath', () => {
  it('returns null when next is missing', async () => {
    await expect(resolveNextPath({})).resolves.toBeNull();
  });

  it('returns the string next value', async () => {
    await expect(resolveNextPath({ next: '/account' })).resolves.toBe('/account');
  });

  it('returns first value from next arrays', async () => {
    await expect(resolveNextPath({ next: ['/account', '/workspaces'] })).resolves.toBe('/account');
  });

  it('supports promised search params', async () => {
    await expect(resolveNextPath(Promise.resolve({ next: '/workspaces' }))).resolves.toBe('/workspaces');
  });
});
