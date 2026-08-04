export type WorkspaceType = 'PERSONAL' | 'TEAM';

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  type: WorkspaceType;
  description: string | null;
  avatarUrl: string | null;
  isArchived: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkspacePayload = {
  name: string;
  type: WorkspaceType;
  description?: string;
};

export type InviteWorkspaceMemberPayload = {
  email: string;
};

export type WorkspaceMemberSummary = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  timestamp: string;
};

function toIsoString(value: unknown) {
  if (typeof value === 'string') return value;
  return new Date(value as string | number | Date | undefined ?? Date.now()).toISOString();
}

function normalizeWorkspace(item: any): WorkspaceSummary {
  const type: WorkspaceType = item?.type === 'TEAM' ? 'TEAM' : 'PERSONAL';

  return {
    id: String(item?.id ?? ''),
    name: typeof item?.name === 'string' && item.name.trim().length > 0 ? item.name : 'Untitled workspace',
    slug: typeof item?.slug === 'string' ? item.slug : '',
    type,
    description: typeof item?.description === 'string' ? item.description : null,
    avatarUrl: typeof item?.avatarUrl === 'string' ? item.avatarUrl : null,
    isArchived: Boolean(item?.isArchived),
    deletedAt: typeof item?.deletedAt === 'string' ? item.deletedAt : null,
    createdAt: toIsoString(item?.createdAt),
    updatedAt: toIsoString(item?.updatedAt),
  };
}

function resolveData<T>(payload: ApiEnvelope<T> | T) {
  const maybeEnvelope = payload as ApiEnvelope<T>;
  if (maybeEnvelope && typeof maybeEnvelope === 'object' && 'data' in maybeEnvelope) {
    return maybeEnvelope.data;
  }
  return payload as T;
}

export async function createWorkspace(payload: CreateWorkspacePayload, headers?: Record<string, string>) {
  const response = await fetch('/api/workspaces', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Failed to create workspace (${response.status})`);
  }

  const body = (await response.json()) as ApiEnvelope<any> | any;
  const data = resolveData<any>(body);
  return normalizeWorkspace(data);
}

export async function fetchWorkspaces(headers?: Record<string, string>) {
  const response = await fetch('/api/workspaces', {
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Failed to load workspaces (${response.status})`);
  }

  const body = (await response.json()) as ApiEnvelope<any> | any;
  const data = resolveData<any>(body);
  const items = Array.isArray(data) ? data : [];
  return items.map(normalizeWorkspace);
}

export async function inviteWorkspaceMember(workspaceId: string, payload: InviteWorkspaceMemberPayload, headers?: Record<string, string>) {
  const response = await fetch(`/api/workspaces/${workspaceId}/invite-member`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Failed to invite workspace member (${response.status})`);
  }

  const body = (await response.json()) as ApiEnvelope<any> | any;
  return resolveData<any>(body);
}

export async function fetchWorkspaceMembers(workspaceId: string, headers?: Record<string, string>) {
  const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Failed to load workspace members (${response.status})`);
  }

  const body = (await response.json()) as ApiEnvelope<any> | any;
  const data = resolveData<any>(body);
  const items = Array.isArray(data) ? data : [];

  return items.map((item: any) => ({
    id: String(item?.id ?? ''),
    userId: String(item?.userId ?? ''),
    email: typeof item?.email === 'string' ? item.email : '',
    name: typeof item?.name === 'string' && item.name.trim().length > 0 ? item.name : 'Unnamed member',
    role: item?.role === 'OWNER' || item?.role === 'ADMIN' ? item.role : 'MEMBER',
    joinedAt: typeof item?.joinedAt === 'string' ? item.joinedAt : new Date().toISOString(),
  })) as WorkspaceMemberSummary[];
}

export async function updateWorkspaceMemberRole(workspaceId: string, memberId: string, role: 'ADMIN' | 'MEMBER', headers?: Record<string, string>) {
  const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Failed to update workspace member role (${response.status})`);
  }

  const body = (await response.json()) as ApiEnvelope<any> | any;
  return resolveData<any>(body);
}

export async function removeWorkspaceMember(workspaceId: string, memberId: string, headers?: Record<string, string>) {
  const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      ...(headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Failed to remove workspace member (${response.status})`);
  }

  const body = (await response.json()) as ApiEnvelope<any> | any;
  return resolveData<any>(body);
}
