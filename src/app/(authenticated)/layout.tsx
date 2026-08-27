import type { ReactNode } from 'react';
import { requireAuthenticated } from '../../shared/auth/routeGuard';

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
