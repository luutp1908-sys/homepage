import React from 'react';
import { cookies } from 'next/headers';
import { ACTIVE_WORKSPACE_STORAGE_KEY } from '../../shared/workspaces/constants';

type TemplateItem = {
  id: string;
  title: string;
  slug?: string;
};

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function TemplateList({ searchParams }: Props) {
  const paramsResolved = searchParams && typeof (searchParams as any).then === 'function' ? await (searchParams as any) : (searchParams ?? {});
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(ACTIVE_WORKSPACE_STORAGE_KEY)?.value;
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

  // If caller passed categorySlug instead of categoryId, attempt to resolve it to an id
  if (!qp.get('categoryId') && paramsResolved?.categorySlug) {
    const slug = Array.isArray(paramsResolved.categorySlug) ? paramsResolved.categorySlug[0] : String(paramsResolved.categorySlug);
    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BE_URL ?? 'http://localhost:3000';
      const catUrl = base.replace(/\/+$/, '') + `/api/categories`;
      const catRes = await fetch(catUrl, { cache: 'no-store' });
      if (catRes.ok) {
        const catPayload = await catRes.json();
        const cats = Array.isArray(catPayload) ? catPayload : catPayload?.data ?? catPayload?.items ?? [];
        const found = Array.isArray(cats) ? cats.find((x: any) => x.slug === slug) : undefined;
        if (found?.id) qp.set('categoryId', String(found.id));
      }
    } catch (e) {
      // ignore resolution failures and continue without categoryId
    }
  }

  // Backend DTO does not accept categorySlug; keep it frontend-only.
  qp.delete('categorySlug');

  const apiPath = `/api/templates${qp.toString() ? `?${qp.toString()}` : ''}`;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BE_URL ?? 'http://localhost:3000';
  const url = base.replace(/\/+$/, '') + apiPath;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return (
      <div className="text-red-600">Failed to load templates ({res.status}){text ? `: ${text}` : ''}</div>
    );
  }

  const payload = await res.json();
  const items: TemplateItem[] = payload?.data?.items ?? payload?.items ?? [];

  if (!items || items.length === 0) {
    return <div className="p-6">No templates found.</div>;
  }

  const editorBase = (process.env.NEXT_PUBLIC_EDITOR_APP_URL || 'http://localhost:5174').replace(/\/+$/, '');

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-6">
      {items.map((t) => (
        <article key={t.id} className="rounded border p-4 bg-white shadow-sm">
          {(() => {
            const editorQuery = new URLSearchParams({ templateId: String(t.id) });
            if (workspaceId) {
              editorQuery.set('workspaceId', String(workspaceId));
            }
            const editorUrl = `${editorBase}?${editorQuery.toString()}`;

            return (
          <a
            href={editorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="text-lg font-semibold">{t.title}</h3>
            <p className="text-sm text-zinc-600">{t.slug}</p>
          </a>
            );
          })()}
        </article>
      ))}
    </div>
  );
}
