import Header from '@/components/layout/Header';
import { LayoutDashboard } from 'lucide-react';

export default function OverviewPage() {
  return (
    <>
      <Header 
        title="Overview" 
        subtitle="System metrics and dashboard" 
        icon={<LayoutDashboard className="w-5 h-5" />} 
      />
      
      <div className="p-6 lg:p-8 space-y-7 max-w-5xl mx-auto w-full">
        {/* Dashboard Content will go here in Stage 5 */}
        <div className="bg-white rounded-[26px] p-8 border border-[#ECE5D9] shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
          <h2 className="text-xl font-bold text-[#1F1E1B] mb-2">Welcome to NikaahKaro CRM</h2>
          <p className="text-[#867E72] max-w-md">
            The dashboard modules will be implemented in Stage 5. For now, you can navigate the sidebar to access other modules.
          </p>
        </div>
      </div>
    </>
  );
}
