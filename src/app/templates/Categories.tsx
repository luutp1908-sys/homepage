import React from 'react';
import Link from 'next/link';
import { loadCategories } from './loaders';

type Props = { searchParams?: { [key: string]: string | string[] | undefined } };

export default async function Categories({ searchParams }: Props) {
    const { params, items, errorMessage } = await loadCategories(searchParams);
    if (errorMessage) {
        return (
            <div className="text-red-600">
                {errorMessage}
            </div>
        );
    }

    return (
        <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
                <a
                    href={`/`}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${!params?.categoryId ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'}`}
                >
                    All
                </a>

                {items.map((c) => {
                    const isActive = (() => {
                        const v = params?.categoryId;
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
