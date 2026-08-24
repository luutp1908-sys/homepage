'use client';

import { useEffect, useState } from 'react';
import { fetchCurrentUser } from './useAuth';

type AuthStateUser = {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
  permissions: string[];
};

export function useAuthState() {
  const [user, setUser] = useState<AuthStateUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setUser(user);
          setIsAuthenticated(Boolean(user?.id));
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
  };
}
