import LoginPageClient from './LoginPageClient'
import { resolveNextPath } from './nextPath';

type SearchParams = { [key: string]: string | string[] | undefined };

type LoginPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = await resolveNextPath(searchParams);

  return <LoginPageClient nextPath={nextPath} />
}
