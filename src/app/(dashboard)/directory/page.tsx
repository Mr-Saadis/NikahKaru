'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { DirectoryClient } from '@/components/directory/DirectoryClient';
import { DIRECTORY_THEME } from '@/lib/directory/directory-theme';

// ============================================================
// /directory — Directory Search & Filtering Console
// Protected: MANAGER + HIGH_LEVEL_ADMIN only
// ============================================================

export default function DirectoryPage() {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  const isAuthorized = role === 'MANAGER' || role === 'HIGH_LEVEL_ADMIN';

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.replace('/overview');
    }
  }, [isLoading, isAuthorized, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="text-sm font-medium"
          style={{ color: DIRECTORY_THEME.text.muted }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div
      className="h-full overflow-hidden"
      style={{
        background: DIRECTORY_THEME.surfaces.app,
        borderRadius: 26,
      }}
    >
      <DirectoryClient />
    </div>
  );
}
