export default function Loading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(255,240,210,0.9),_transparent_55%),linear-gradient(135deg,_#f8fafc_0%,_#fef7ed_100%)]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white/90 p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] backdrop-blur sm:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-zinc-200" />
            <div className="h-10 w-96 rounded bg-zinc-200" />
            <div className="h-4 w-full max-w-2xl rounded bg-zinc-200" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="h-64 rounded-3xl border border-zinc-200 bg-white/90 animate-pulse" />
          <div className="h-64 rounded-3xl border border-zinc-200 bg-white/90 animate-pulse" />
        </section>
      </main>
    </div>
  );
}