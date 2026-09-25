'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  HeartHandshake,
  FileCheck,
  Send,
  MessageSquareWarning,
  ShieldCheck,
  LineChart,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
}

export default function Sidebar({ activePage }: SidebarProps) {
  const { user, role, roleData } = useAuth();
  
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().clearSession();
    window.location.href = '/login';
  };

  const navItems = [
    {
      label: 'Overview',
      href: '/overview',
      icon: LayoutDashboard,
      roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'],
      id: 'overview'
    },
    {
      label: 'Profiles & Dossiers',
      href: '/profiles',
      icon: Users,
      roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'],
      id: 'profiles'
    },
    {
      label: 'Add New Profile',
      href: '/add-profile',
      icon: UserPlus,
      roles: ['AGENT'], // Based on PRD, Agent creates profile
      id: 'add-new'
    },
    {
      label: 'Matching Engine',
      href: '/matching',
      icon: HeartHandshake,
      roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'],
      id: 'matching'
    },
    {
      label: 'Release Requests',
      href: '/release-requests',
      icon: FileCheck,
      roles: ['MANAGER', 'HIGH_LEVEL_ADMIN'],
      id: 'release-requests',
      badge: 3 // Example badge
    },
    {
      label: 'Proposals In Progress',
      href: '/proposals',
      icon: Send,
      roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'],
      id: 'proposals'
    },
    {
      label: 'Rejection Feedback',
      href: '/feedback',
      icon: MessageSquareWarning,
      roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'],
      id: 'feedback'
    }
  ];

  const adminItems = [
    {
      label: 'User Management',
      href: '/admin/users',
      icon: ShieldCheck,
      id: 'admin-users'
    },
    {
      label: 'System Analytics',
      href: '/admin/analytics',
      icon: LineChart,
      id: 'admin-analytics'
    }
  ];

  const visibleNavItems = navItems.filter(item => role && item.roles.includes(role));
  
  // Initials for avatar
  const initials = user?.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] bg-[#FBF9F5] border-r border-[#EFE9DF] h-full flex-shrink-0 relative z-20">
      
      {/* Brand & Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#064e3b] to-[#0f4229] flex items-center justify-center drop-shadow-sm flex-shrink-0">
            <HeartHandshake className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[17px] font-bold tracking-tight text-[#16382E] leading-tight">
              NikaahKaro
            </span>
            <span className="w-max bg-[#E5EFE9] text-[#125740] text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded mt-0.5">
              Internal CRM
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="text-[10px] font-extrabold text-[#A8A296] uppercase tracking-[0.15em] mb-3 px-2">
          Main Menu
        </div>
        <nav className="flex flex-col gap-1.5">
          {visibleNavItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <Link 
                key={item.id} 
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all ${
                  isActive 
                    ? 'font-semibold text-white bg-[#064e3b] shadow-sm py-3 text-[14px]' 
                    : 'text-[13.5px] font-medium text-[#676156] hover:bg-[#F2ECE1]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#888174]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-[#064e3b]' : 'bg-[#EAE2D5] text-[#4E473D]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Navigation */}
      {role === 'HIGH_LEVEL_ADMIN' && (
        <div className="p-6 pt-2 pb-4">
          <div className="text-[10px] font-extrabold text-[#A8A296] uppercase tracking-[0.15em] mb-3 px-2">
            System Admin
          </div>
          <nav className="flex flex-col gap-1.5">
            {adminItems.map((item) => {
              const isActive = activePage.startsWith(item.id);
              return (
                <Link 
                  key={item.id} 
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all ${
                    isActive 
                      ? 'font-semibold text-white bg-[#064e3b] shadow-sm py-3 text-[14px]' 
                      : 'text-[13.5px] font-medium text-[#676156] hover:bg-[#F2ECE1]'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#888174]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <div className="mt-auto p-6 pt-2">
        {/* User Pill */}
        <div className="bg-white border border-[#EBE4D8] rounded-[22px] p-2.5 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#115E49] flex items-center justify-center text-white font-bold ring-2 ring-[#E0EEE8] flex-shrink-0">
            {initials}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[13.5px] font-bold text-[#1E2022] truncate">
              {user?.full_name || 'Loading...'}
            </span>
            <span className="bg-[#F7E7CE] text-[#825418] text-[10px] font-semibold rounded-full px-2 py-0.5 w-max mt-0.5">
              {roleData?.name.replace(/_/g, ' ') || 'AGENT'}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#8D867C] hover:text-[#115E49] hover:bg-[#F6F2EA] transition-colors flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}
