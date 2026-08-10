import WorkspacesPageClient from './WorkspacesPageClient';
import { requireAuthenticated } from '../../shared/auth/routeGuard';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Workspaces',
    description: 'View and manage your template draft workspaces',
};

export default async function WorkspacesPage() {
    await requireAuthenticated('/workspaces');
    return <WorkspacesPageClient />;
}