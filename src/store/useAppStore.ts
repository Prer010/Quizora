import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserData {
  clerkId: string;
  email: string;
  name: string;
  imageUrl?: string;
}

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  lastSync: number | null;
  setUser: (user: UserData | null) => void;
  clearUser: () => void;
  updateLastSync: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      lastSync: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearUser: () => set({ user: null, isAuthenticated: false, lastSync: null }),
      updateLastSync: () => set({ lastSync: Date.now() }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
