import type { Metadata } from 'next';

type MaybePromise<T> = T | Promise<T>;

type CategorySeo = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  robotsMeta?: string | null;
};

type CategoryLike = {
  id: string;
  name: string;
  slug?: string;
  seo?: CategorySeo | null;
};

export const BROWSE_REVALIDATE_SECONDS = 60;

type NextFetchCacheOptions = RequestInit & {
  next: {
    revalidate: number;
    tags: string[];
  };
};

export const CATEGORY_CACHE_OPTIONS: NextFetchCacheOptions = {
  next: {
    revalidate: BROWSE_REVALIDATE_SECONDS,
    tags: ['categories'],
  },
};

export const TEMPLATE_CACHE_OPTIONS: NextFetchCacheOptions = {
  next: {
    revalidate: BROWSE_REVALIDATE_SECONDS,
    tags: ['templates'],
  },
};

export async function resolveMaybePromise<T>(value: MaybePromise<T>): Promise<T> {
  return await value;
}

export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

export async function fetchCategories(params?: Record<string, string | string[] | undefined>): Promise<CategoryLike[]> {
  const qp = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) value.forEach((item) => qp.append(key, String(item)));
      else qp.set(key, String(value));
    }
  }

  const url = `${getBaseUrl()}/api/categories${qp.toString() ? `?${qp.toString()}` : ''}`;
  const res = await fetch(url, CATEGORY_CACHE_OPTIONS);
  if (!res.ok) return [];

  const payload = await res.json();
  return Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
}

export function buildSeoMetadata(opts: {
  fallbackTitle: string;
  fallbackDescription: string;
  path: string;
  seo?: CategorySeo | null;
}): Metadata {
  const { fallbackTitle, fallbackDescription, path, seo } = opts;
  const baseUrl = getBaseUrl();

  const title = seo?.metaTitle?.trim() || fallbackTitle;
  const description = seo?.metaDescription?.trim() || fallbackDescription;
  const canonical = seo?.canonicalUrl?.trim() || `${baseUrl}${path}`;
  const ogTitle = seo?.ogTitle?.trim() || title;
  const ogDescription = seo?.ogDescription?.trim() || description;
  const robotsRaw = seo?.robotsMeta?.trim() || 'index,follow';
  const robotsNoIndex = /noindex/i.test(robotsRaw);
  const robotsNoFollow = /nofollow/i.test(robotsRaw);

  return {
    title,
    description,
    keywords: seo?.metaKeywords?.trim() || undefined,
    alternates: { canonical },
    robots: {
      index: !robotsNoIndex,
      follow: !robotsNoFollow,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: ogTitle,
      description: ogDescription,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
    twitter: {
      card: seo?.ogImage ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription,
      images: seo?.ogImage ? [seo.ogImage] : undefined,
    },
  };
}
