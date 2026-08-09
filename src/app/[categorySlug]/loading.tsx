export default function Loading() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-5xl flex-col items-start py-8 px-6 bg-white dark:bg-black">
        <div className="w-full animate-pulse">
          <div className="h-8 w-72 rounded bg-zinc-200 mb-3" />
          <div className="h-4 w-64 rounded bg-zinc-200 mb-6" />

          <div className="mb-5 flex flex-wrap gap-2">
            <div className="h-8 w-20 rounded-full bg-zinc-200" />
            <div className="h-8 w-28 rounded-full bg-zinc-200" />
            <div className="h-8 w-24 rounded-full bg-zinc-200" />
          </div>

          <div className="mb-5 h-10 w-full rounded bg-zinc-200" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="h-36 rounded border border-zinc-200 bg-zinc-100" />
            <div className="h-36 rounded border border-zinc-200 bg-zinc-100" />
            <div className="h-36 rounded border border-zinc-200 bg-zinc-100" />
          </div>
        </div>
      </main>
    </div>
  );
}