'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/store';
import { NotificationSettingsSync } from './NotificationSettingsSync';

export function StoreInitializer({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const initialize = useDataStore((state) => state.initialize);
  const cleanup = useDataStore((state) => state.cleanup);

  useEffect(() => {
    if (!loading && user) {
      // Initialize store with user ID
      initialize(user.id);
    } else if (!loading && !user) {
      // Cleanup when user logs out
      cleanup();
    }

    // Cleanup on unmount
    return () => {
      if (user) {
        cleanup();
      }
    };
  }, [user, loading, initialize, cleanup]);

  return (
    <>
      {children}
      <NotificationSettingsSync />
    </>
  );
}
