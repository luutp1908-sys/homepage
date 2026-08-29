import React from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ACTIVE_WORKSPACE_STORAGE_KEY } from '../../shared/workspaces/constants';
import { loadTemplates } from './loaders';

type TemplateItem = {
  id: string;
  title: string;
  slug?: string;
};

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function TemplateList({ searchParams }: Props) {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(ACTIVE_WORKSPACE_STORAGE_KEY)?.value;
  const { items, errorMessage } = await loadTemplates(searchParams);
  if (errorMessage) {
    return (
      <div className="text-red-600">{errorMessage}</div>
    );
  }

  if (!items || items.length === 0) {
    return <div className="p-6">No templates found.</div>;
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-6">
      {items.map((t) => (
        <article key={t.id} className="rounded border p-4 bg-white shadow-sm">
          {(() => {
            const editorQuery = new URLSearchParams({ templateId: String(t.id) });
            if (workspaceId) {
              editorQuery.set('workspaceId', String(workspaceId));
            }
            const editorUrl = `/editor?${editorQuery.toString()}`;

            return (
          <Link
            href={editorUrl}
            className="block"
          >
            <h3 className="text-lg font-semibold">{t.title}</h3>
            <p className="text-sm text-zinc-600">{t.slug}</p>
          </Link>
            );
          })()}
        </article>
      ))}
    </div>
  );
}
