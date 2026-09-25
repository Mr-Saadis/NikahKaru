'use client';

import { Bell, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showBackButton?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  idBadge?: string;
  isLive?: boolean;
}

export default function Header({
  title,
  subtitle,
  icon,
  showBackButton,
  primaryAction,
  secondaryAction,
  idBadge,
  isLive,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-[#FCF9F4] border-b border-[#E9E4DC] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
        
        {/* Left Section: Icon, Back Button, Title, Subtitle */}
        <div className="flex items-center gap-4">
          
          {showBackButton && (
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-white hover:bg-[#F4ECE1] border border-[#E9E4DC] shadow-sm text-[#064e3b] flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {icon && !showBackButton && (
            <div className="w-11 h-11 rounded-2xl bg-white border border-[#E9E4DC] shadow-sm text-[#064e3b] flex items-center justify-center">
              {icon}
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-[26px] font-extrabold text-[#002b17] tracking-tight">
                {title}
              </h1>
              
              {idBadge && (
                <span className="bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc] text-[12px] font-bold px-2.5 py-0.5 rounded-full mt-1">
                  {idBadge}
                </span>
              )}

              {isLive && (
                <div className="bg-[#E5EFE9] text-[#064e3b] border border-[#d1e3dc] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 mt-1">
                  <div className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
                  LIVE
                </div>
              )}
            </div>

            {subtitle && (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[13px] font-medium text-[#717972]">{subtitle}</p>
                {/* Optional separator dot if you want to add more subtitle items later */}
                {/* <div className="w-1 h-1 rounded-full bg-[#717972]" /> */}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Actions & Notifications */}
        <div className="flex items-center gap-3">
          
          {secondaryAction && (
            <button 
              onClick={secondaryAction.onClick}
              className="bg-white hover:bg-[#F4ECE1] text-[#24211D] border border-[#E9E4DC] font-bold text-[12.5px] px-4 py-2.5 rounded-full shadow-sm transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}

          {primaryAction && (
            <button 
              onClick={primaryAction.onClick}
              className="bg-[#064e3b] text-white hover:bg-[#0f4229] font-bold text-[12.5px] px-5 py-2.5 rounded-full shadow-sm hover:-translate-y-0.5 transition-transform"
            >
              {primaryAction.label}
            </button>
          )}

          <button className="relative w-10 h-10 rounded-2xl bg-white border border-[#E9E4DC] hover:bg-[#F4ECE1] shadow-sm flex items-center justify-center text-[#4E473D] transition-colors ml-1">
            <Bell className="w-5 h-5" />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white" />
          </button>
          
        </div>

      </div>
    </header>
  );
}
