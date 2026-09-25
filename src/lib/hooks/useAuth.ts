import { useAuthStore, type UserRoleName } from '@/lib/stores/auth-store';

// ============================================================
// useAuth Hook — Access cached auth data
// ALL reads from Zustand store. ZERO API calls.
// ============================================================

/**
 * Access authenticated user data, role, and permissions.
 * Data is loaded ONCE at session start and cached.
 * This hook NEVER triggers an API call.
 *
 * @example
 * ```tsx
 * const { user, role, isAdmin, isAgent, hasPermission } = useAuth();
 *
 * if (isAdmin()) { ... }
 * if (hasPermission('MANAGE_USERS')) { ... }
 * ```
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const roleData = useAuthStore((s) => s.roleData);
  const permissions = useAuthStore((s) => s.permissions);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const error = useAuthStore((s) => s.error);

  // Role check helpers — pure state reads, ZERO API calls
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isManager = useAuthStore((s) => s.isManager);
  const isAgent = useAuthStore((s) => s.isAgent);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  /**
   * Check if user has one of the given roles
   */
  const hasRole = (...roles: UserRoleName[]): boolean => {
    return role ? roles.includes(role) : false;
  };

  return {
    // Data
    user,
    role,
    roleData,
    permissions,

    // State
    isAuthenticated,
    isLoading,
    isInitialized,
    error,

    // Role helpers
    isAdmin,
    isManager,
    isAgent,
    hasRole,
    hasPermission,
  };
}
