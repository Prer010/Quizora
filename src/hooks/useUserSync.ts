import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '@/store/useAppStore';

export function useUserSync() {
  const { user, isLoaded } = useUser();
  const syncUser = useMutation(api.users.syncUser);
  const { setUser, clearUser, lastSync, updateLastSync } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const now = Date.now();
      const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

      // Only sync if never synced or last sync was more than 5 minutes ago
      if (!lastSync || now - lastSync > SYNC_INTERVAL) {
        syncUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          name: user.fullName || user.firstName || 'User',
          imageUrl: user.imageUrl,
        }).then(() => {
          setUser({
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            name: user.fullName || user.firstName || 'User',
            imageUrl: user.imageUrl,
          });
          updateLastSync();
        });
      } else {
        // Update local state without syncing
        setUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          name: user.fullName || user.firstName || 'User',
          imageUrl: user.imageUrl,
        });
      }
    } else {
      clearUser();
    }
  }, [user, isLoaded, lastSync]);
}
