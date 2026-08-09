import type { Metadata } from 'next';
import TemplateList from './templates/TemplateList';
import FilterControls from './templates/FilterControls';
import Categories from './templates/Categories';
import { buildSeoMetadata, fetchCategories, resolveMaybePromise } from './lib/seo';

type SearchParams = { [key: string]: string | string[] | undefined };

export const revalidate = 60;

export async function generateMetadata({ searchParams }: { searchParams?: SearchParams | Promise<SearchParams> }): Promise<Metadata> {
  const resolvedSearchParams = await resolveMaybePromise(searchParams ?? {});
  const categories = await fetchCategories(resolvedSearchParams);
  const categoryWithSeo = categories.find((c: any) => c?.seo);

  return buildSeoMetadata({
    fallbackTitle: 'Templates',
    fallbackDescription: 'Browse available templates for your next design project.',
    path: '/',
    seo: categoryWithSeo?.seo ?? null,
  });
}

export default async function Home({ searchParams }: { searchParams?: SearchParams | Promise<SearchParams> }) {
  const resolvedSearchParams = await resolveMaybePromise(searchParams ?? {});
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-5xl flex-col items-start py-8 px-6 bg-white dark:bg-black">
        <div className="w-full">
          <h1 className="text-2xl font-semibold mb-2">Templates</h1>
          <p className="text-sm text-zinc-600 mb-4">Browse available templates (server-side rendered).</p>
        </div>

        <Categories searchParams={resolvedSearchParams} />

        <FilterControls />

        <TemplateList searchParams={resolvedSearchParams} />
      </main>
    </div>
  );
}
