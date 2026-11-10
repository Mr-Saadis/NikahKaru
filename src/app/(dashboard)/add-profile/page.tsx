'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import AddProfileForm from '@/components/profile/AddProfileForm';
import { useAuth } from '@/lib/hooks/useAuth';
import { Suspense } from 'react';

export default function AddProfilePage() {
  const { user, isInitialized, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/login');
    }
  }, [isInitialized, user, router]);

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-sm font-medium text-[#7D766C]">Loading profile form...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header title="Add Profile" variant="dark" />
      <Suspense fallback={<div className="p-8 text-center text-sm font-medium text-[#7D766C]">Loading form...</div>}>
        <AddProfileForm />
      </Suspense>
    </>
  );
}
