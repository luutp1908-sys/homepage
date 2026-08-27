type DraftCardProps = {
  draftId: string;
  name: string;
  templateId: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  lastOpenedAt: string | null;
  editorUrl: string;
};

function formatDate(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function DraftCard({ draftId, name, templateId, updatedAt, createdAt, lastOpenedAt, editorUrl }: DraftCardProps) {
  return (
    <article key={draftId} className="rounded border border-zinc-200 bg-white shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50">
      <a href={editorUrl} target="_blank" rel="noopener noreferrer" className="block cursor-pointer p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-zinc-900">{name}</h3>
            <p className="mt-1 text-xs text-zinc-500">Draft ID: {draftId}</p>
            <p className="mt-1 text-xs text-zinc-500">Template ID: {templateId ?? 'N/A'}</p>
            <p className="mt-2 text-xs font-medium text-zinc-700">Open in editor</p>
          </div>

          <div className="grid grid-cols-1 gap-1 text-xs text-zinc-600 md:text-right">
            <p>Updated: {formatDate(updatedAt)}</p>
            <p>Created: {formatDate(createdAt)}</p>
            <p>Last opened: {formatDate(lastOpenedAt)}</p>
          </div>
        </div>
      </a>
    </article>
  );
}
