import type { Metadata } from 'next';
import TemplateList from '../templates/TemplateList';
import FilterControls from '../templates/FilterControls';
import Categories from '../templates/Categories';
import { buildSeoMetadata, fetchCategories, resolveMaybePromise } from '../lib/seo';

type PageParams = { categorySlug: string };
type SearchParams = { [key: string]: string | string[] | undefined };

export const revalidate = 60;

export async function generateMetadata({ params }: { params: PageParams | Promise<PageParams> }): Promise<Metadata> {
  const paramsValue = await resolveMaybePromise(params);
  const categories = await fetchCategories();
  const category = categories.find((item: any) => item.slug === paramsValue.categorySlug);

  return buildSeoMetadata({
    fallbackTitle: `${category?.name ?? paramsValue.categorySlug} Templates`,
    fallbackDescription: `Browse ${category?.name ?? paramsValue.categorySlug} templates for your next design project.`,
    path: `/${encodeURIComponent(paramsValue.categorySlug)}`,
    seo: category?.seo ?? null,
  });
}

export default async function CategoryPage({ params, searchParams }: { params: PageParams | Promise<PageParams>, searchParams?: SearchParams | Promise<SearchParams> }) {
  const paramsValue = await resolveMaybePromise(params);
  const paramsResolved = await resolveMaybePromise(searchParams ?? {});
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
        <TemplateList searchParams={merged} />
      </main>
    </div>
  );
}
