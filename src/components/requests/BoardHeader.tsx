'use client';

import { Bell } from 'lucide-react';

// ============================================================
// BoardHeader — Logo mark, title, and nav pill
// ============================================================



export default function BoardHeader() {
  return (
    <div className="flex items-center justify-between">
      {/* Left: logo + text */}
      <div className="flex items-center gap-[14px]">

        <div>
          <div style={{ fontSize: 11.5, color: '#A3B18A', fontWeight: 500 }}>
            Manager Console
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: -0.6,
              color: '#1F3B34',
              lineHeight: 1.15,
            }}
          >
            Request Operations
          </div>
        </div>
      </div>

      {/* Right: Notifications */}
      <div className="hidden min-[900px]:block pr-2">
        <button
          type="button"
          className="group flex items-center justify-center cursor-pointer text-[#1F3B34] hover:opacity-70 transition-opacity bg-transparent border-none"
        >
          <Bell size={24} className="animate-ding-dong-hover" />
        </button>
      </div>
    </div>
  );
}
