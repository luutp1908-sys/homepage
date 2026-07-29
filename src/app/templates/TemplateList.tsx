import React from 'react';

type TemplateItem = {
  id: string;
  title: string;
  slug?: string;
};

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function TemplateList({ searchParams }: Props) {
  const qp = new URLSearchParams();
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (!v) continue;
      if (Array.isArray(v)) v.forEach((x) => qp.append(k, x));
      else qp.set(k, String(v));
    }
  }

  const res = await fetch(`${process.env.BE_URL ?? 'http://localhost:3000'}/api/templates?${qp.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    return <div className="text-red-600">Failed to load templates ({res.status})</div>;
  }

  const payload = await res.json();
  const items: TemplateItem[] = payload?.data?.items

  if (!items || items.length === 0) {
    return <div className="p-6">No templates found.</div>;
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-6">
      {items.map((t) => (
        <article key={t.id} className="rounded border p-4 bg-white shadow-sm">
          <a
            href={`http://localhost:5174?templateId=${encodeURIComponent(t.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="text-lg font-semibold">{t.title}</h3>
            <p className="text-sm text-zinc-600">{t.slug}</p>
          </a>
        </article>
      ))}
    </div>
  );
}
