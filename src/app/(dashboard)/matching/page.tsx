'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MatchingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/overview');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <div className="text-lg font-bold text-[#1F1E1B] mb-2">Access Restricted</div>
        <div className="text-[#8d8c86] text-sm">
          Matching is only accessible via the dedicated profile and request workflows. Redirecting to overview...
        </div>
      </div>
    </div>
  );
}
