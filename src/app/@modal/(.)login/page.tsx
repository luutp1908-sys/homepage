import LoginModalShell from './LoginModalShell';
import { resolveNextPath } from '../../(public)/login/nextPath';

type SearchParams = { [key: string]: string | string[] | undefined };

type LoginModalRouteProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function LoginModalRoute({ searchParams }: LoginModalRouteProps) {
  const nextPath = await resolveNextPath(searchParams);

  return <LoginModalShell nextPath={nextPath} />;
}