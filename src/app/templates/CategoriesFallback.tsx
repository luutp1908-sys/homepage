export default function CategoriesFallback() {
  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-14 animate-pulse rounded-full bg-zinc-200" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-zinc-200" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-zinc-200" />
        <div className="h-8 w-16 animate-pulse rounded-full bg-zinc-200" />
      </div>
    </div>
  );
}