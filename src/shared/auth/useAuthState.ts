'use client';

import { useEffect, useState } from 'react';
import { fetchCurrentUser } from './useAuth';

export function useAuthState() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setIsAuthenticated(Boolean(user?.id));
        }
      } catch {
        if (!cancelled) {
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
    isAuthenticated,
    isLoading,
  };
}
