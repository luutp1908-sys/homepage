import AccountPanel from '../components/AccountPanel';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Account',
  description: 'Manage your account profile and password',
};

export default function AccountPage() {
  return <AccountPanel />;
}
