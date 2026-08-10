import { clearStoredAuthTokens, getAuthHeaders, persistAuthTokens } from './getAuthHeaders';

type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  timestamp?: string
}

type AuthUser = {
  id: string
  email: string
  displayName: string | null
  roles: string[]
  permissions: string[]
}

type AuthPayload = {
  accessToken: string
  refreshToken?: string
  tokenType: string
  accessTokenExpiresIn: string
  user: AuthUser
}

function getApiBase() {
  return process.env.NEXT_PUBLIC_BE_API_BASE || 'http://localhost:4000';
}

export async function loginWithEmailPassword(email: string, password: string) {
  const base = getApiBase()
  const url = `${base}/api/v1/auth/login`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(body || 'Login failed')
  }

  const payload = (await res.json()) as ApiEnvelope<AuthPayload>
  const token = payload?.data?.accessToken ?? null
  const refreshToken = payload?.data?.refreshToken ?? null
  persistAuthTokens(token, refreshToken)

  return payload?.data?.user ?? null
}

export async function fetchCurrentUser() {
  const headers = getAuthHeaders();
  try {
    const res = await fetch('/api/user/me', {
      cache: 'no-store',
      headers,
    });

    if (!res.ok) {
      if (res.status === 401) {
        logout();
      }
      return null;
    }

    const body = (await res.json()) as ApiEnvelope<AuthUser> | AuthUser;
    if (body && typeof body === 'object' && 'data' in body) {
      return (body as ApiEnvelope<AuthUser>).data ?? null;
    }

    return body as AuthUser;
  } catch {
    return null;
  }
}

export function logout() {
  clearStoredAuthTokens();
}
