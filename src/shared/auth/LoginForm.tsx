'use client';

import React, { useState } from 'react'

type LoginFormProps = {
  title?: string
  submitLabel?: string
  redirectTo?: string
  requiredRole?: string
  login: (email: string, password: string) => Promise<any>
}

export default function LoginForm({
  title = 'Sign in',
  submitLabel = 'Sign in',
  redirectTo = '/',
  requiredRole,
  login,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const user = await login(email, password)
      if (requiredRole && !user?.roles?.includes(requiredRole)) {
        setError('You are not authorized to access this area')
        return
      }

      if (redirectTo) {
        window.location.href = redirectTo
      }
    } catch (err: any) {
      const message = err?.message || 'Login failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <h2>{title}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div>
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : submitLabel}
        </button>
      </form>
    </div>
  )
}
