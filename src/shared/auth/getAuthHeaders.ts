function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!value) return null;
  return decodeURIComponent(value.slice(name.length + 1));
}

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const cookieToken = getCookie('access_token');
  if (cookieToken) {
    return cookieToken;
  }

  // One-time migration from legacy sessionStorage token to cookie storage.
  const legacyToken = window.sessionStorage.getItem('homepage_access_token');
  if (legacyToken) {
    document.cookie = `access_token=${encodeURIComponent(legacyToken)}; Path=/; Max-Age=900; SameSite=Lax`;
    window.sessionStorage.removeItem('homepage_access_token');
    return legacyToken;
  }

  return null;
}

function notifyAuthStateChanged() {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent('homepage-auth-changed'));
}

export function getAuthHeaders() {
  const token = getStoredAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function persistAuthTokens(accessToken?: string | null, refreshToken?: string | null) {
  if (typeof window === 'undefined') return;

  if (accessToken) {
    document.cookie = `access_token=${encodeURIComponent(accessToken)}; Path=/; Max-Age=900; SameSite=Lax`;
  }

  if (refreshToken) {
    document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }

  window.sessionStorage.removeItem('homepage_access_token');
  notifyAuthStateChanged();
}

export function clearStoredAuthTokens() {
  if (typeof window === 'undefined') return;

  document.cookie = 'access_token=; Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = 'refresh_token=; Path=/; Max-Age=0; SameSite=Lax';
  window.sessionStorage.removeItem('homepage_access_token');
  notifyAuthStateChanged();
}
