'use client';

import { useEffect, useState } from 'react';

type Profile = {
  id?: string;
  email?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type PasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('homepage_access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export default function AccountPanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/user/me', { cache: 'no-store', headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Unable to load profile');
        const data = await res.json();
        setProfile(data?.data || {});
        setDisplayName(data?.data?.displayName ?? '');
        setAvatarUrl(data?.data?.avatarUrl ?? '');
      } catch (error: any) {
        setMessage(error?.message ?? 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', ...(getAuthHeaders() || {}) },
        body: JSON.stringify({ displayName, avatarUrl: avatarUrl || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to update profile');
      }

      const data = await res.json();
      setProfile(data?.data || {});
      setMessage('Profile updated');
    } catch (error: any) {
      setMessage(error?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload: PasswordPayload = {
        currentPassword,
        newPassword,
      };

      const res = await fetch('/api/user/me/password', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', ...(getAuthHeaders() || {}) },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to change password');
      }

      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password updated');
    } catch (error: any) {
      setMessage(error?.message ?? 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading account...</div>;
  }
  console.log('profile', profile)
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-zinc-600">Manage your profile details and password.</p>
      </div>

      {message ? <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm">{message}</div> : null}

      <form onSubmit={updateProfile} className="rounded border border-zinc-200 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">Profile</h2>
        <div className="grid gap-4">
          <label className="text-sm font-medium">
            Email
            <input className="mt-1 w-full rounded border px-3 py-2" value={profile?.email ?? ''} disabled />
          </label>
          <label className="text-sm font-medium">
            Display name
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Avatar URL
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
            />
          </label>
        </div>
        <button className="mt-4 rounded bg-black px-4 py-2 text-white" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      <form onSubmit={changePassword} className="rounded border border-zinc-200 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">Change password</h2>
        <div className="grid gap-4">
          <label className="text-sm font-medium">
            Current password
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            New password
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
        </div>
        <button className="mt-4 rounded bg-black px-4 py-2 text-white" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
