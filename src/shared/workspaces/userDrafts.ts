export type DraftSortBy = 'updatedAt' | 'createdAt';
export type DraftSortOrder = 'asc' | 'desc';

export type UserDraftListQuery = {
  page: number;
  pageSize: number;
  sortBy: DraftSortBy;
  sortOrder: DraftSortOrder;
};

export type UserDraftSummary = {
  id: string;
  templateId: string | null;
  name: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
};

export type UserDraftListResult = {
  items: UserDraftSummary[];
  total: number;
  page: number;
  pageSize: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  timestamp: string;
};

function normalizeDraft(item: any): UserDraftSummary {
  return {
    id: String(item?.id ?? ''),
    templateId: item?.templateId ?? null,
    name: typeof item?.name === 'string' && item.name.trim().length > 0 ? item.name : 'Untitled draft',
    thumbnail: typeof item?.thumbnail === 'string' ? item.thumbnail : null,
    createdAt: typeof item?.createdAt === 'string' ? item.createdAt : new Date(item?.createdAt ?? Date.now()).toISOString(),
    updatedAt: typeof item?.updatedAt === 'string' ? item.updatedAt : new Date(item?.updatedAt ?? Date.now()).toISOString(),
    lastOpenedAt: typeof item?.lastOpenedAt === 'string' ? item.lastOpenedAt : null,
  };
}

export async function fetchUserDrafts(query: UserDraftListQuery, headers?: Record<string, string>) {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  const response = await fetch(`/api/user-drafts?${params.toString()}`, {
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Failed to load drafts (${response.status})`);
  }

  const payload = (await response.json()) as ApiEnvelope<any>;
  const data = payload?.data ?? {};
  const items = Array.isArray(data?.items) ? data.items.map(normalizeDraft) : [];

  return {
    items,
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? query.page),
    pageSize: Number(data?.pageSize ?? query.pageSize),
  } as UserDraftListResult;
}
