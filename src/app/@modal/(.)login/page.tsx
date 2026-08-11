import LoginModalShell from './LoginModalShell';

type SearchParams = { [key: string]: string | string[] | undefined };

type LoginModalRouteProps = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

function resolveFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function LoginModalRoute({ searchParams }: LoginModalRouteProps) {
  const resolvedSearchParams = await (searchParams ?? {});
  const nextPath = resolveFirst(resolvedSearchParams.next);

  return <LoginModalShell nextPath={nextPath} />;
}