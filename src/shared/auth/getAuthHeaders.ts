export function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('homepage_access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}
