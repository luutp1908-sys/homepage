import AccountPanel from '../components/AccountPanel';
import { requireAuthenticated } from '../../shared/auth/routeGuard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Account',
  description: 'Manage your account profile and password',
};

export default async function AccountPage() {
  await requireAuthenticated('/account');
  return <AccountPanel />;
}
