import 'server-only';

import { buildHomepageApiUrl } from '../api/fetch-utils';

function normalizeList(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export async function fetchCategoriesByPath(apiPath: string, cacheOptions: RequestInit) {
  const response = await fetch(buildHomepageApiUrl(apiPath), cacheOptions);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {
      items: [] as any[],
      errorMessage: `Failed to load categories (${response.status})${text ? `: ${text}` : ''}`,
    };
  }

  const payloadText = await response.text().catch(() => '');
  let payload: any;
  try {
    payload = payloadText ? JSON.parse(payloadText) : [];
  } catch {
    return {
      items: [] as any[],
      errorMessage: 'Failed to load categories: upstream returned non-JSON content.',
    };
  }

  return {
    items: normalizeList(payload),
    errorMessage: null as string | null,
  };
}

export async function fetchTemplatesByPath(apiPath: string, cacheOptions: RequestInit) {
  const response = await fetch(buildHomepageApiUrl(apiPath), cacheOptions);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {
      items: [] as any[],
      errorMessage: `Failed to load templates (${response.status})${text ? `: ${text}` : ''}`,
    };
  }

  const payloadText = await response.text().catch(() => '');
  let payload: any;
  try {
    payload = payloadText ? JSON.parse(payloadText) : [];
  } catch {
    return {
      items: [] as any[],
      errorMessage: 'Failed to load templates: upstream returned non-JSON content.',
    };
  }

  return {
    items: normalizeList(payload),
    errorMessage: null as string | null,
  };
}

export function findCategoryIdBySlug(categories: any[], slug: string) {
  const found = categories.find((item: any) => item?.slug === slug);
  return found?.id ? String(found.id) : null;
}
