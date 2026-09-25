'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import type { User, Role } from '@/lib/types/database.types';

// ============================================================
// AUTH PROVIDER — Session initialization
// Runs ONCE when app loads. Fetches user + role + permissions
// from Supabase and stores in Zustand. After that, ZERO re-fetches.
// ============================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { setSession, clearSession, setLoading, setError, setInitialized, isInitialized } =
    useAuthStore();

  const initializeAuth = useCallback(async () => {
    const supabase = createClient();

    try {
      setLoading(true);

      // Step 1: Get current Supabase auth user
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        clearSession();
        return;
      }

      // Step 2: Fetch application user + role + permissions in ONE combined query
      // This is the ONLY time we fetch this data. After this, it's cached.
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError || !userData) {
        setError('User profile not found. Please contact administrator.');
        clearSession();
        return;
      }

      // Check if user account is active
      if (userData.status !== 'ACTIVE') {
        setError(
          userData.status === 'SUSPENDED'
            ? 'Your account has been suspended. Please contact administrator.'
            : 'Your account is inactive. Please contact administrator.'
        );
        clearSession();
        return;
      }

      // Step 3: Get user role with role details
      const { data: userRoleData, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('user_id', authUser.id)
        .limit(1)
        .single();

      if (roleError || !userRoleData?.roles) {
        setError('No role assigned. Please contact administrator.');
        clearSession();
        return;
      }

      // Supabase returns nested relation as object (since limit 1 + single)
      const role = userRoleData.roles as unknown as Role;

      // Step 4: Get permissions for this role
      const { data: permissionsData } = await supabase
        .from('role_permissions')
        .select(`
          permissions (
            code
          )
        `)
        .eq('role_id', role.id);

      const permissions: string[] = (permissionsData || [])
        .map((rp) => (rp.permissions as unknown as { code: string })?.code)
        .filter(Boolean);

      // Step 5: Store EVERYTHING in auth store — cached for entire session
      setSession({
        user: userData as User,
        role,
        permissions,
      });
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('An error occurred during authentication.');
      clearSession();
    }
  }, [setSession, clearSession, setLoading, setError]);

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  // Listen for auth state changes (login/logout from other tabs)
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearSession();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Re-initialize only if not already initialized
        if (!useAuthStore.getState().isAuthenticated) {
          setInitialized(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clearSession, setInitialized]);

  return <>{children}</>;
}
