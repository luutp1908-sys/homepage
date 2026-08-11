import { describe, expect, it } from 'vitest';
import { buildSeoMetadata } from './seo';

describe('buildSeoMetadata', () => {
  it('uses fallback values when seo payload is missing', () => {
    const metadata = buildSeoMetadata({
      fallbackTitle: 'Templates',
      fallbackDescription: 'Browse templates',
      path: '/category',
      seo: null,
    });

    expect(metadata.title).toBe('Templates');
    expect(metadata.description).toBe('Browse templates');
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/category');
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it('prefers provided seo fields and parses robots meta flags', () => {
    const metadata = buildSeoMetadata({
      fallbackTitle: 'Templates',
      fallbackDescription: 'Browse templates',
      path: '/category',
      seo: {
        metaTitle: 'Custom Title',
        metaDescription: 'Custom Description',
        metaKeywords: 'a,b,c',
        canonicalUrl: 'https://example.com/custom',
        robotsMeta: 'noindex,nofollow',
        ogTitle: 'OG Custom Title',
        ogDescription: 'OG Custom Description',
        ogImage: 'https://example.com/image.png',
      },
    });

    expect(metadata.title).toBe('Custom Title');
    expect(metadata.description).toBe('Custom Description');
    expect(metadata.keywords).toBe('a,b,c');
    expect(metadata.alternates?.canonical).toBe('https://example.com/custom');
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.openGraph?.title).toBe('OG Custom Title');
    expect(metadata.openGraph?.images).toEqual([{ url: 'https://example.com/image.png' }]);
  });
});