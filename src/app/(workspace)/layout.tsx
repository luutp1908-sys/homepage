import type { ReactNode } from 'react';
import { requireAuthenticated } from '../../shared/auth/routeGuard';

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
