import WorkspacesPageClient from './WorkspacesPageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Workspaces',
    description: 'View and manage your template draft workspaces',
};

export default function WorkspacesPage() {
    return <WorkspacesPageClient />;
}