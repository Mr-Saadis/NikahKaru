'use client';

import { useEffect } from 'react';
import { useReferenceDataStore } from '@/lib/stores/reference-data-store';

// ============================================================
// REFERENCE DATA PROVIDER
// Wraps authenticated app. Loads ALL 10 reference tables
// on mount (ONCE). Shows loading state until data is ready.
// After load: all dropdowns use cached data. ZERO API calls.
// ============================================================

interface ReferenceDataProviderProps {
  children: React.ReactNode;
}

export default function ReferenceDataProvider({ children }: ReferenceDataProviderProps) {
  const { isLoaded, isLoading, error, loadAll } = useReferenceDataStore();

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      loadAll();
    }
  }, [isLoaded, isLoading, loadAll]);

  // Show loading state while reference data is being fetched
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-4">
          {/* Animated spinner */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-[3px] border-[#E9E4DC]" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-t-[#064e3b] animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[14px] font-semibold text-[#002b17] tracking-tight">
              Loading NikahKaru
            </p>
            <p className="text-[12px] font-medium text-[#717972]">
              Preparing reference data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if reference data failed to load
  if (error && !isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF8F5]">
        <div className="bg-white rounded-[24px] p-8 border border-[#ECE5D9] shadow-sm max-w-md mx-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#991B1B]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1F1E1B]">Unable to Load Data</h3>
              <p className="text-[13px] text-[#717972] mt-1">{error}</p>
            </div>
            <button
              onClick={() => {
                useReferenceDataStore.getState().reset();
                loadAll();
              }}
              className="flex items-center gap-2 bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold text-[13px] px-5 py-2.5 rounded-full shadow-sm transition duration-150 transform hover:-translate-y-0.5"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
