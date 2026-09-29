import { create } from 'zustand';

/**
 * Navigation Lock Store
 * 
 * Prevents page navigation while background algorithms are running.
 * Each running algorithm registers a lock with a unique key (profile ID).
 * Navigation is blocked as long as ANY lock exists.
 */
interface NavigationLockState {
  locks: Record<string, string>; // key → label (e.g., profileId → "Running match for Ahmed")
  addLock: (key: string, label: string) => void;
  removeLock: (key: string) => void;
  isLocked: () => boolean;
  getLockCount: () => number;
  getLockLabels: () => string[];
}

export const useNavigationLock = create<NavigationLockState>((set, get) => ({
  locks: {},

  addLock: (key, label) =>
    set((state) => ({
      locks: { ...state.locks, [key]: label },
    })),

  removeLock: (key) =>
    set((state) => {
      const { [key]: _, ...rest } = state.locks;
      return { locks: rest };
    }),

  isLocked: () => Object.keys(get().locks).length > 0,

  getLockCount: () => Object.keys(get().locks).length,

  getLockLabels: () => Object.values(get().locks),
}));
