import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearStoredAuthTokens, getAuthHeaders, persistAuthTokens } from './getAuthHeaders';
import { fetchCurrentUser } from './useAuth';

class MockSessionStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

function setupBrowserMocks() {
  const sessionStorage = new MockSessionStorage();
  const cookieJar = new Map<string, string>();

  const documentMock = {} as { cookie: string };
  Object.defineProperty(documentMock, 'cookie', {
    configurable: true,
    get() {
      return Array.from(cookieJar.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
    },
    set(value: string) {
      const firstPart = value.split(';')[0]?.trim() ?? '';
      if (!firstPart) return;
      const separatorIndex = firstPart.indexOf('=');
      if (separatorIndex < 0) return;

      const name = firstPart.slice(0, separatorIndex).trim();
      const cookieValue = firstPart.slice(separatorIndex + 1).trim();
      cookieJar.set(name, cookieValue);
    },
  });

  const windowMock = {
    sessionStorage,
    dispatchEvent: vi.fn(),
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: windowMock,
  });

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: documentMock,
  });

  return { sessionStorage, cookieJar };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  Reflect.deleteProperty(globalThis, 'document');
});

describe('getAuthHeaders', () => {
  it('migrates legacy session token into cookie-backed auth header', () => {
    const { sessionStorage, cookieJar } = setupBrowserMocks();
    sessionStorage.setItem('homepage_access_token', 'legacy-token');

    const headers = getAuthHeaders();

    expect(headers).toEqual({ Authorization: 'Bearer legacy-token' });
    expect(sessionStorage.getItem('homepage_access_token')).toBeNull();
    expect(cookieJar.get('access_token')).toBe('legacy-token');
  });

  it('prefers cookie access token and clears legacy token when both exist', () => {
    const { sessionStorage } = setupBrowserMocks();
    sessionStorage.setItem('homepage_access_token', 'legacy-token');
    persistAuthTokens('cookie-token', null);

    const headers = getAuthHeaders();

    expect(headers).toEqual({ Authorization: 'Bearer cookie-token' });
    expect(sessionStorage.getItem('homepage_access_token')).toBeNull();
  });

  it('clears legacy session token when persisting or clearing cookie auth', () => {
    const { sessionStorage } = setupBrowserMocks();
    sessionStorage.setItem('homepage_access_token', 'legacy-token');

    persistAuthTokens('new-token', 'refresh-token');
    expect(sessionStorage.getItem('homepage_access_token')).toBeNull();

    sessionStorage.setItem('homepage_access_token', 'legacy-token-2');
    clearStoredAuthTokens();
    expect(sessionStorage.getItem('homepage_access_token')).toBeNull();
  });

  it('returns null without issuing a user lookup when there is no access token', async () => {
    setupBrowserMocks();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const user = await fetchCurrentUser();

    expect(user).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
