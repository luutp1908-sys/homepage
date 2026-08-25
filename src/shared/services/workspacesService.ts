import 'server-only';

import { CreateWorkspacePayload, WorkspaceType } from '../workspaces/workspaces';
import {
  getBackendUrl,
  getServerAuthHeaders,
  parseJsonSafely,
  readEnvelopeError,
  resolveEnvelopeData,
} from './backendClient';

type RoleUpdatePayload = {
  workspaceId: string;
  memberId: string;
  role: 'ADMIN' | 'MEMBER';
};

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

export async function createWorkspaceForServer(payload: CreateWorkspacePayload) {
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
  const parsed = parseJsonSafely(text);

  if (!response.ok) {
    throw new Error(readEnvelopeError(parsed, `Failed to create workspace (${response.status})`));
  }

  const created = normalizeWorkspace(resolveEnvelopeData<any>(parsed));
  return created;
}

export async function updateWorkspaceMemberRoleForServer(payload: RoleUpdatePayload) {
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
  const parsed = parseJsonSafely(text);

  if (!response.ok) {
    throw new Error(readEnvelopeError(parsed, `Failed to update workspace member role (${response.status})`));
  }

  return resolveEnvelopeData<any>(parsed);
}
