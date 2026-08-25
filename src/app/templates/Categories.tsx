import React from 'react';
import { CATEGORY_CACHE_OPTIONS } from '../lib/seo';
import Link from 'next/link';
import { buildHomepageApiUrl } from '../../shared/api/fetch-utils';

type Category = { id: string; name: string; slug?: string };

type Props = { searchParams?: { [key: string]: string | string[] | undefined } };

export default async function Categories({ searchParams }: Props) {
    const paramsResolved = searchParams && typeof (searchParams as any).then === 'function' ? await (searchParams as any) : (searchParams ?? {});

    const qp = new URLSearchParams();
    if (paramsResolved) {
        for (const [k, v] of Object.entries(paramsResolved)) {
            if (!v) continue;
            if (k === 'categorySlug') continue;
            if (k === 'workspaceId') continue;
            if (Array.isArray(v)) v.forEach((x) => qp.append(k, x));
            else qp.set(k, String(v));
        }
    }

    const apiPath = `/api/categories${qp.toString() ? `?${qp.toString()}` : ''}`;
    const url = buildHomepageApiUrl(apiPath);
    const res = await fetch(url, CATEGORY_CACHE_OPTIONS);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        return (
            <div className="text-red-600">
                Failed to load categories ({res.status}){text ? `: ${text}` : ''}
            </div>
        );
    }

    const payload = await res.json();
    const items: Category[] = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];

    return (
        <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
                <a
                    href={`/`}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${!paramsResolved?.categoryId ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'}`}
                >
                    All
                </a>

                {items.map((c) => {
                    const isActive = (() => {
                        const v = paramsResolved?.categoryId;
                        if (!v) return false;
                        if (Array.isArray(v)) return v.includes(c.id);
                        return v === c.id;
                    })();

                    return (
                        <Link
                            key={c.id}
                            href={`/${encodeURIComponent(c.slug ?? c.id)}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border"
                        >
                            {c.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
