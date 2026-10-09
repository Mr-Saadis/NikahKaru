'use client';

import NotificationDropdown from '@/components/NotificationDropdown';

// ============================================================
// BoardHeader — Logo mark, title, and nav pill
// ============================================================



export default function BoardHeader() {
  return (
    <div className="flex items-center justify-between">
      {/* Left: logo + text */}
      <div className="flex items-center gap-[14px]">

        <div>
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
        <NotificationDropdown
          btnClass="group flex items-center justify-center cursor-pointer text-[#1F3B34] hover:opacity-70 transition-opacity bg-transparent border-none relative"
          iconClass="animate-ding-dong-hover"
          iconSize={24}
        />
      </div>
    </div>
  );
}
