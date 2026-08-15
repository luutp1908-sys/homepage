export default function EmptyState() {
  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white/80 p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-2xl">✦</div>
      <h2 className="mt-4 text-lg font-semibold text-zinc-900">No drafts yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
        Create or edit a template to start collecting polished draft concepts in this workspace.
      </p>
    </div>
  );
}
