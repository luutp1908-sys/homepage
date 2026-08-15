import type { ChangeEvent } from 'react';

type SortOption = 'updatedAt-desc' | 'createdAt-desc' | 'createdAt-asc';

type DraftSortPanelProps = {
  sortOption: SortOption;
  onSortChange: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export default function DraftSortPanel({ sortOption, onSortChange }: DraftSortPanelProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-600">Sort drafts</p>
          <p className="text-xs text-zinc-500">Keep your latest work in view</p>
        </div>
      </div>
      <label className="mt-4 block text-sm font-medium text-zinc-700">
        <select
          className="mt-2 block w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none"
          value={sortOption}
          onChange={onSortChange}
        >
          <option value="updatedAt-desc">Last updated (newest)</option>
          <option value="createdAt-desc">Created (newest)</option>
          <option value="createdAt-asc">Created (oldest)</option>
        </select>
      </label>
    </div>
  );
}
