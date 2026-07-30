import Image from 'next/image';
import TemplateList from './templates/TemplateList';
import FilterControls from './templates/FilterControls';
import Categories from './templates/Categories';

export default async function Home({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-5xl flex-col items-start py-8 px-6 bg-white dark:bg-black">
        <div className="w-full">
          <h1 className="text-2xl font-semibold mb-2">Templates</h1>
          <p className="text-sm text-zinc-600 mb-4">Browse available templates (server-side rendered).</p>
        </div>

        <Categories searchParams={searchParams} />

        <FilterControls />

        <TemplateList searchParams={searchParams} />
      </main>
    </div>
  );
}
