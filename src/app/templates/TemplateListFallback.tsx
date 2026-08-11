type TemplateListFallbackProps = {
  count?: number;
};

export default function TemplateListFallback({ count = 6 }: TemplateListFallbackProps) {
  return (
    <div className="grid gap-4 grid-cols-1 p-6 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}