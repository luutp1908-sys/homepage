export const metadata = {
  title: 'Editor',
  description: 'Embedded editor host route',
};

export default function PublicEditorPage() {
  return (
    <div className="flex flex-1 bg-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-1 px-6 py-8">
        <div className="w-full rounded border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Editor</h1>
          <p className="mt-2 text-sm text-zinc-600">Embedded editor route is ready at /editor.</p>
        </div>
      </main>
    </div>
  );
}
