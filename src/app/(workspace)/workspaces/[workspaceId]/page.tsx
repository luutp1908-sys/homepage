import WorkspaceLegacyRedirectClient from './WorkspaceLegacyRedirectClient';
import { requireAuthenticated } from '../../../../shared/auth/routeGuard';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Workspaces',
  description: 'View and manage your template draft workspaces',
};

type WorkspaceByIdPageProps = {
  params: { workspaceId: string } | Promise<{ workspaceId: string }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default async function WorkspaceByIdPage({ params }: WorkspaceByIdPageProps) {
  const resolvedParams = params && typeof (params as any).then === 'function' ? await (params as any) : params;
  const workspaceId = String(resolvedParams?.workspaceId ?? '').trim();

  if (!isUuid(workspaceId)) {
    notFound();
  }

  await requireAuthenticated(`/workspaces/${encodeURIComponent(workspaceId)}`);

  return <WorkspaceLegacyRedirectClient workspaceId={workspaceId} />;
}
