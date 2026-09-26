import { create } from 'zustand';
import type { User, Role } from '@/lib/types/database.types';

// ============================================================
// AUTH STORE — Zustand
// User + Role + Permissions cached for ENTIRE session.
// Fetched ONCE at login/session init. ZERO re-fetches.
// ============================================================

export type UserRoleName = 'HIGH_LEVEL_ADMIN' | 'MANAGER' | 'AGENT';

interface AuthState {
  // User data
  user: User | null;
  role: UserRoleName | null;
  roleData: Role | null;
  permissions: string[];

  // Session state
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  setSession: (data: {
    user: User;
    role: Role;
    permissions: string[];
  }) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;

  // Role check helpers — read from cache, ZERO API calls
  isAdmin: () => boolean;
  isManager: () => boolean;
  isAgent: () => boolean;
  hasPermission: (code: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  role: null,
  roleData: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,

  // Set session after successful auth — called ONCE
  setSession: ({ user, role, permissions }) =>
    set({
      user,
      role: role.name?.toUpperCase() as UserRoleName,
      roleData: role,
      permissions,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      error: null,
    }),

  // Clear session on logout
  clearSession: () =>
    set({
      user: null,
      role: null,
      roleData: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),

  // Role check helpers — pure reads from cached state
  isAdmin: () => get().role === 'HIGH_LEVEL_ADMIN',
  isManager: () => get().role === 'MANAGER',
  isAgent: () => get().role === 'AGENT',
  hasPermission: (code: string) => get().permissions.includes(code),
}));
