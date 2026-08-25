import Link from 'next/link';

export default function CategoryNotFound() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-5xl flex-col items-start py-8 px-6 bg-white dark:bg-black">
        <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-zinc-900">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-600">Category not found</p>
          <h2 className="mt-2 text-2xl font-semibold">This category does not exist or is no longer available.</h2>
          <p className="mt-2 text-sm text-zinc-600">Try returning to all templates to continue browsing.</p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Back to templates
          </Link>
        </div>
      </main>
    </div>
  );
}
