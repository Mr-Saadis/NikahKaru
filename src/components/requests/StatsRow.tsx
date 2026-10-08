'use client';

// ============================================================
// StatsRow — Total Entries, Respond Later, Staff Involved
// ============================================================

interface StatsRowProps {
  total: number;
  later: number;
  staffInvolved: number;
  hideStaffFilter?: boolean;
}

export default function StatsRow({ total, later, staffInvolved, hideStaffFilter }: StatsRowProps) {
  const items = [
    { label: 'Total Entries', value: total },
    { label: 'Respond Later', value: later },
    ...(hideStaffFilter ? [] : [{ label: 'Staff Involved', value: staffInvolved }]),
  ];

  return (
    <div className="hidden min-[900px]:flex items-end gap-[34px]">
      {items.map((item) => (
        <div key={item.label} className="text-right">
          <div style={{ fontSize: 11, color: '#A3B18A', fontWeight: 500 }}>
            {item.label}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: -0.8,
              lineHeight: 1.1,
              color: '#1F3B34',
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
