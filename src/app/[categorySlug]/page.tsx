import TemplateList from '../templates/TemplateList';
import FilterControls from '../templates/FilterControls';
import Categories from '../templates/Categories';

export default async function CategoryPage({ params, searchParams }: { params: { categorySlug: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  const paramsValue = params && typeof (params as any).then === 'function' ? await (params as any) : params;
  const paramsResolved = searchParams && typeof (searchParams as any).then === 'function' ? await (searchParams as any) : (searchParams ?? {});
  const merged = { ...(paramsResolved ?? {}), categorySlug: paramsValue.categorySlug } as { [key: string]: string | string[] | undefined };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-5xl flex-col items-start py-8 px-6 bg-white dark:bg-black">
        <div className="w-full">
          <h1 className="text-2xl font-semibold mb-2">Templates — {paramsValue.categorySlug}</h1>
          <p className="text-sm text-zinc-600 mb-4">Server-side list for category</p>
        </div>

        <Categories searchParams={merged} />
        <FilterControls />
        {/* @ts-expect-error Server Component */}
        <TemplateList searchParams={merged} />
      </main>
    </div>
  );
}
