import WorkspaceLegacyRedirectClient from './WorkspaceLegacyRedirectClient';
import { requireAuthenticated } from '../../../shared/auth/routeGuard';

export const metadata = {
  title: 'Workspaces',
  description: 'View and manage your template draft workspaces',
};

type WorkspaceByIdPageProps = {
  params: { workspaceId: string } | Promise<{ workspaceId: string }>;
};

export default async function WorkspaceByIdPage({ params }: WorkspaceByIdPageProps) {
  const resolvedParams = params && typeof (params as any).then === 'function' ? await (params as any) : params;
  const workspaceId = String(resolvedParams?.workspaceId ?? '').trim();

  await requireAuthenticated(`/workspaces/${encodeURIComponent(workspaceId)}`);

  return <WorkspaceLegacyRedirectClient workspaceId={workspaceId} />;
}
