let currentAccessToken: string | null = null

type ApiEnvelope<T> = {
  success: boolean
  data: T
  timestamp: string
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
  tokenType: string
  accessTokenExpiresIn: string
  user: AuthUser
}

function getApiBase() {
  const metaEnv = (typeof import.meta !== 'undefined' ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env : undefined) as
    | Record<string, string | undefined>
    | undefined
  const processEnv = (typeof process !== 'undefined' ? process.env : undefined) as Record<string, string | undefined> | undefined

  return (metaEnv?.VITE_BE_API_BASE || processEnv?.NEXT_PUBLIC_BE_API_BASE || processEnv?.VITE_BE_API_BASE || 'http://localhost:4000') as string
}

function getStorage() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

try {
  const storage = getStorage()
  const saved = storage?.getItem('shared_access_token')
  if (saved) currentAccessToken = saved
} catch {}

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
  currentAccessToken = token
  const storage = getStorage()
  if (token && storage) storage.setItem('shared_access_token', token)

  return payload?.data?.user ?? null
}

export async function fetchCurrentUser() {
  const base = getApiBase()
  const headers: Record<string, string> = {}
  if (currentAccessToken) headers['Authorization'] = `Bearer ${currentAccessToken}`

  const res = await fetch(`${base}/api/v1/auth/me`, { credentials: 'include', headers })
  if (res.ok) {
    const body = (await res.json()) as ApiEnvelope<AuthUser>
    return body?.data ?? null
  }

  if (res.status === 401) {
    const refreshed = await refreshTokens()
    if (!refreshed) {
      logout()
      return null
    }
    const headers2: Record<string, string> = {}
    if (currentAccessToken) headers2['Authorization'] = `Bearer ${currentAccessToken}`
    const res2 = await fetch(`${base}/api/v1/auth/me`, { credentials: 'include', headers: headers2 })
    if (!res2.ok) {
      logout()
      return null
    }
    const body2 = (await res2.json()) as ApiEnvelope<AuthUser>
    return body2?.data ?? null
  }

  return null
}

async function refreshTokens() {
  const base = getApiBase()
  try {
    const res = await fetch(`${base}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    })
    if (!res.ok) return null
    const body = (await res.json()) as ApiEnvelope<AuthPayload>
    const token = body?.data?.accessToken ?? null
    if (token) {
      currentAccessToken = token
      const storage = getStorage()
      if (storage) storage.setItem('shared_access_token', token)
    }
    return body?.data ?? null
  } catch {
    return null
  }
}

export function logout() {
  currentAccessToken = null
  const storage = getStorage()
  if (storage) storage.removeItem('shared_access_token')
}
