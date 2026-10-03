'use client';

import { HomeIcon } from './icons';

// ============================================================
// BoardHeader — Logo mark, title, and nav pill
// ============================================================

const NAV_ITEMS = ['Requests', 'Activity', 'Comments', 'Reports'] as const;

export default function BoardHeader() {
  return (
    <div className="flex items-center justify-between">
      {/* Left: logo + text */}
      <div className="flex items-center gap-[14px]">
        {/* Logo mark */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #1F3B34 0%, #2F3E51 100%)', // Pine Grove to Blue Granite
            boxShadow: '0 6px 14px rgba(31,59,52,0.2)',
          }}
        >
          {/* Leaf glyph */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.5 2 2 6.5 2 12c2-4 6-7 10-7s8 3 10 7c0-5.5-4.5-10-10-10Z"
              fill="white"
              opacity={0.9}
            />
            <path
              d="M12 22c5.5 0 10-4.5 10-10-2 4-6 7-10 7S4 16 2 12c0 5.5 4.5 10 10 10Z"
              fill="white"
              opacity={0.6}
            />
          </svg>
        </div>
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

      {/* Right: nav pill — hidden below 900px */}
      <div className="hidden min-[900px]:block">
        <div
          className="flex items-center gap-[2px]"
          style={{
            background: '#fff',
            borderRadius: 9999,
            padding: 4,
          }}
        >
          {/* Home circle */}
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#F2EDE1', // Cannoli Cream
            }}
          >
            <HomeIcon size={16} style={{ color: '#1F3B34' }} />
          </div>

          {/* Nav items */}
          {NAV_ITEMS.map((item) => {
            const isActive = item === 'Requests';
            return (
              <button
                key={item}
                type="button"
                className="cursor-default select-none"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '8px 14px',
                  borderRadius: 9999,
                  background: isActive ? '#1F3B34' : 'transparent',
                  color: isActive ? '#fff' : '#1F3B34',
                  border: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
