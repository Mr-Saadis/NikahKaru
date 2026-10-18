'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import AddProfileForm from '@/components/profile/AddProfileForm';
import { useAuth } from '@/lib/hooks/useAuth';
import { Suspense } from 'react';

export default function AddProfilePage() {
  const { isInitialized } = useAuth();

  return (
    <>
      <Header title="Add Profile" variant="dark" />
      <Suspense fallback={<div className="p-8 text-center text-sm font-medium text-[#7D766C]">Loading form...</div>}>
        <AddProfileForm />
      </Suspense>
    </>
  );
}
