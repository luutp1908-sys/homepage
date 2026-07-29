"use client";
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterControls() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get('search') ?? '';
  const [search, setSearch] = useState(initial);

  function apply() {
    const qp = new URLSearchParams(Array.from(params.entries()));
    if (search) qp.set('search', search); else qp.delete('search');
    router.push(`/?${qp.toString()}`);
  }

  return (
    <div className="p-4 flex gap-2 items-center">
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates" className="rounded border px-3 py-2" />
      <button onClick={apply} className="rounded bg-foreground px-3 py-2 text-background">Apply</button>
    </div>
  );
}
