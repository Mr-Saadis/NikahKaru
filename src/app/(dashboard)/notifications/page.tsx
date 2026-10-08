import Header from '@/components/layout/Header';
import NotificationsView from '@/components/notifications/NotificationsView';
import { Suspense } from 'react';

export default function NotificationsPage() {
  return (
    <>
      <Header title="Notifications" variant="dark" />
      <div 
        className="h-full overflow-hidden"
        style={{
          background: 'var(--bg-app)',
          borderRadius: 26,
        }}
      >
        <Suspense fallback={<div className="p-8 text-center text-sm font-medium text-[#7D766C]">Loading notifications...</div>}>
          <NotificationsView />
        </Suspense>
      </div>
    </>
  );
}
