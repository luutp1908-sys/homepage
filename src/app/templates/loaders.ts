import 'server-only';

import { CATEGORY_CACHE_OPTIONS, TEMPLATE_CACHE_OPTIONS } from '../lib/seo';
import {
  fetchCategoriesByPath,
  fetchTemplatesByPath,
  findCategoryIdBySlug,
} from '../../shared/services/browseService';

type SearchParams = { [key: string]: string | string[] | undefined };

type CategoryItem = {
  id: string;
  name: string;
  slug?: string;
};

type TemplateItem = {
  id: string;
  title: string;
  slug?: string;
};

function resolveParams(searchParams?: SearchParams | Promise<SearchParams>) {
  if (searchParams && typeof (searchParams as any).then === 'function') {
    return searchParams as Promise<SearchParams>;
  }

  return Promise.resolve((searchParams ?? {}) as SearchParams);
}

function buildQuery(params: SearchParams, exclude: string[] = []) {
  const qp = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    if (exclude.includes(key)) continue;

    if (Array.isArray(value)) {
      value.forEach((item) => qp.append(key, item));
    } else {
      qp.set(key, String(value));
    }
  }

  return qp;
}

export async function loadCategories(searchParams?: SearchParams | Promise<SearchParams>) {
  const resolved = await resolveParams(searchParams);
  const query = buildQuery(resolved, ['categorySlug', 'workspaceId']);
  const apiPath = `/api/categories${query.toString() ? `?${query.toString()}` : ''}`;
  const result = await fetchCategoriesByPath(apiPath, CATEGORY_CACHE_OPTIONS);

  return {
    params: resolved,
    items: result.items as CategoryItem[],
    errorMessage: result.errorMessage,
  };
}

export async function loadTemplates(searchParams?: SearchParams | Promise<SearchParams>) {
  const resolved = await resolveParams(searchParams);
  const query = buildQuery(resolved, ['categorySlug', 'workspaceId']);

  if (!query.get('categoryId') && resolved?.categorySlug) {
    const slug = Array.isArray(resolved.categorySlug) ? resolved.categorySlug[0] : String(resolved.categorySlug);
    const categories = await fetchCategoriesByPath('/api/categories', CATEGORY_CACHE_OPTIONS);

    if (!categories.errorMessage) {
      const categoryId = findCategoryIdBySlug(categories.items, slug);
      if (categoryId) {
        query.set('categoryId', categoryId);
      }
    }
  }

  query.delete('categorySlug');

  const apiPath = `/api/templates${query.toString() ? `?${query.toString()}` : ''}`;
  const result = await fetchTemplatesByPath(apiPath, TEMPLATE_CACHE_OPTIONS);

  return {
    items: result.items as TemplateItem[],
    errorMessage: result.errorMessage,
  };
}
