import { describe, expect, it } from 'vitest';
import { sanitizeNextPath } from './sanitizeNextPath';

describe('sanitizeNextPath', () => {
  it('falls back to workspaces for empty or invalid values', () => {
    expect(sanitizeNextPath(null)).toBe('/workspaces');
    expect(sanitizeNextPath(undefined)).toBe('/workspaces');
    expect(sanitizeNextPath('')).toBe('/workspaces');
    expect(sanitizeNextPath('https://evil.com')).toBe('/workspaces');
    expect(sanitizeNextPath('//evil.com')).toBe('/workspaces');
  });

  it('keeps safe in-app paths', () => {
    expect(sanitizeNextPath('/workspaces')).toBe('/workspaces');
    expect(sanitizeNextPath('/workspaces/123?tab=members')).toBe('/workspaces/123?tab=members');
  });
});