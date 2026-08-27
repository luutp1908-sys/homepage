import DraftCard from './DraftCard';

type DraftItem = {
  id: string;
  name: string;
  templateId: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  lastOpenedAt: string | null;
};

type DraftsSectionProps = {
  items: DraftItem[];
  page: number;
  total: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  getDraftEditorUrl: (draftId: string) => string;
};

export default function DraftsSection({
  items,
  page,
  total,
  totalPages,
  onPreviousPage,
  onNextPage,
  getDraftEditorUrl,
}: DraftsSectionProps) {
  return (
    <section className="rounded-[24px] border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Recent drafts</h2>
          <p className="text-sm text-zinc-600">Your latest work, organized by the selected workspace.</p>
        </div>
        <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-600">
          {total} drafts
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <DraftCard
            key={item.id}
            draftId={item.id}
            name={item.name}
            templateId={item.templateId}
            updatedAt={item.updatedAt}
            createdAt={item.createdAt}
            lastOpenedAt={item.lastOpenedAt}
            editorUrl={getDraftEditorUrl(item.id)}
          />
        ))}

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-zinc-600">
            Page {page} of {totalPages} ({total} drafts)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onPreviousPage}
              disabled={page <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onNextPage}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
