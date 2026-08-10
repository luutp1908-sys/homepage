'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { CreateWorkspacePayload, WorkspaceType } from '../../shared/workspaces/workspaces';

type RoleUpdatePayload = {
  workspaceId: string;
  memberId: string;
  role: 'ADMIN' | 'MEMBER';
};

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
};

function getBackendUrl(path: string) {
  const beBase = process.env.BE_URL ?? 'http://localhost:4000';
  return `${beBase.replace(/\/+$/, '')}${path}`;
}

function resolveData<T>(payload: ApiEnvelope<T> | T) {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    const data = (payload as ApiEnvelope<T>).data;
    if (data !== undefined) {
      return data;
    }
  }

  return payload as T;
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

function normalizeWorkspaceType(value: unknown): WorkspaceType {
  return value === 'TEAM' ? 'TEAM' : 'PERSONAL';
}

function normalizeWorkspace(item: any) {
  return {
    id: String(item?.id ?? ''),
    name: typeof item?.name === 'string' && item.name.trim().length > 0 ? item.name : 'Untitled workspace',
    slug: typeof item?.slug === 'string' ? item.slug : '',
    type: normalizeWorkspaceType(item?.type),
    description: typeof item?.description === 'string' ? item.description : null,
    avatarUrl: typeof item?.avatarUrl === 'string' ? item.avatarUrl : null,
    isArchived: Boolean(item?.isArchived),
    deletedAt: typeof item?.deletedAt === 'string' ? item.deletedAt : null,
    createdAt: typeof item?.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item?.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
  };
}

async function getServerAuthHeaders() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  const cookieHeader = cookieStore.toString();
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

export async function createWorkspaceAction(payload: CreateWorkspacePayload) {
  const name = payload.name.trim();
  if (!name) {
    throw new Error('Workspace name is required.');
  }

  const headers = await getServerAuthHeaders();
  const response = await fetch(getBackendUrl('/api/v1/workspace'), {
    method: 'POST',
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name,
      type: payload.type,
      description: payload.description?.trim() ? payload.description.trim() : undefined,
    }),
    cache: 'no-store',
  });

  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as ApiEnvelope<any> | any) : null;

  if (!response.ok) {
    throw new Error(readErrorMessage(parsed, `Failed to create workspace (${response.status})`));
  }

  const created = normalizeWorkspace(resolveData<any>(parsed));
  revalidatePath('/workspaces');
  return created;
}

export async function updateWorkspaceMemberRoleAction(payload: RoleUpdatePayload) {
  if (!payload.workspaceId) {
    throw new Error('Workspace is required.');
  }

  if (!payload.memberId) {
    throw new Error('Member is required.');
  }

  if (!['ADMIN', 'MEMBER'].includes(payload.role)) {
    throw new Error('Invalid member role.');
  }

  const headers = await getServerAuthHeaders();
  const response = await fetch(getBackendUrl(`/api/v1/workspace/${payload.workspaceId}/members/${payload.memberId}`), {
    method: 'PATCH',
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ role: payload.role }),
    cache: 'no-store',
  });

  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as ApiEnvelope<any> | any) : null;

  if (!response.ok) {
    throw new Error(readErrorMessage(parsed, `Failed to update workspace member role (${response.status})`));
  }

  revalidatePath('/workspaces');
  return resolveData<any>(parsed);
}