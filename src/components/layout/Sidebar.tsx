'use client';

import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useNavigationLock } from '@/lib/stores/navigation-lock-store';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  HeartHandshake,
  FileCheck,
  ClipboardList,
  Send,
  MessageSquareWarning,
  ShieldCheck,
  LineChart,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  PanelLeftOpen,
  Bell,
  Menu,
  X,
  BookUser,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  activePage: string;
}

/*
  ╔══════════════════════════════════════════════════╗
  ║  DESIGN TOKENS                                   ║
  ╚══════════════════════════════════════════════════╝
*/
const SIDEBAR = '#1F3B34'; //'#708c69';   // deep forest green
// PAGE_BG is now dynamic based on pathname
const ICON_OFF = '#fcf3e3';   // muted icon colour
const ORANGE = '#A3B18A';   // muted icon colour
const ROW_H = 50;          // nav-row height in px
const CURVE = 29.15;          // gooey-curve radius in px
const GAP = 8;          // space between aside right edge and wrapper right edge

export const navItems = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard, roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'overview' },
  { label: 'Profiles', href: '/profiles', icon: Users, roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'profiles' },
  { label: 'Add Profile', href: '/add-profile', icon: UserPlus, roles: ['AGENT'], id: 'add-new' },
  { label: 'Matching', href: '/matching', icon: HeartHandshake, roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'matching' },
  { label: 'Requests', href: '/requests', icon: ClipboardList, roles: ['MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'requests' },
  { label: 'My Requests', href: '/agent-requests', icon: ClipboardList, roles: ['AGENT'], id: 'agent-requests' },
  { label: 'Directory', href: '/directory', icon: BookUser, roles: ['MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'directory' },
  { label: 'Releases', href: '/release-requests', icon: FileCheck, roles: ['MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'release-requests' },
  { label: 'Proposals', href: '/proposals', icon: Send, roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'proposals' },
  { label: 'Feedback', href: '/feedback', icon: MessageSquareWarning, roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'feedback' },
  { label: 'Notifications', href: '/notifications', icon: Bell, roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'notifications' },
];

export const adminItems = [
  { label: 'Users', href: '/admin/users', icon: ShieldCheck, roles: ['HIGH_LEVEL_ADMIN'], id: 'admin-users' },
  { label: 'Analytics', href: '/admin/analytics', icon: LineChart, roles: ['HIGH_LEVEL_ADMIN'], id: 'admin-analytics' },
];

/*
  ┌──────────────────────────────────────────────────────────────┐
  │  HOW THE GOOEY CUTOUT WORKS                                  │
  │                                                              │
  │  4 layers stacked on each active row:                        │
  │                                                              │
  │  z:1  PAGE_BG STRIP  — vertical column at right edge,       │
  │                        extends CURVE px above & below row,   │
  │                        extends GAP px past aside edge        │
  │                        → creates the "notch" area            │
  │                                                              │
  │  z:2  PAGE_BG PILL   — horizontal pill filling the row,     │
  │                        rounded left edge,                    │
  │                        extends GAP px past aside edge        │
  │                        → the active row background           │
  │                                                              │
  │  z:3  GREEN CURVE ×2 — SIDEBAR-coloured squares with one    │
  │                        rounded corner each, placed on top    │
  │                        of the strip's upper & lower portions │
  │                        → their body hides PAGE_BG,           │
  │                          their rounded corner reveals it     │
  │                        = the concave gooey transition        │
  │                                                              │
  │  z:10 CONTENT        — icon circle + label                  │
  └──────────────────────────────────────────────────────────────┘
*/

const NavItem = ({ item, isActive, open, onClick, pageBg }: { item: typeof navItems[0]; isActive: boolean; open: boolean; onClick: () => void; pageBg: string }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const navLock = useNavigationLock();
  const locked = navLock.isLocked() && !isActive;

  return (
    <Tooltip open={open ? false : tooltipOpen} onOpenChange={setTooltipOpen}>
      <TooltipTrigger render={
        <Link
          href={locked ? '#' : item.href}
          onClick={(e) => {
            if (locked) { e.preventDefault(); return; }
            onClick();
          }}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            height: ROW_H,
            overflow: 'visible',
            textDecoration: 'none',
            opacity: locked ? 0.35 : 1,
            pointerEvents: locked ? 'none' : 'auto',
            cursor: locked ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.3s ease',
          }}
        />
      }>
        {/* ──── GOOEY LAYERS (Animated structure, instant opacity) ──── */}
        <>
          {/* ──── z:1 — PAGE_BG vertical strip (creates notch + gooey area) ──── */}
          <div
            style={{
              position: 'absolute',
              right: -GAP,
              top: -CURVE,
              bottom: -CURVE,
              width: CURVE + GAP,
              background: pageBg,
              opacity: isActive ? 1 : 0,
              zIndex: 1,
              pointerEvents: 'none',
              transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1), left 0.7s cubic-bezier(0.4, 0, 0.2, 1), right 0.7s cubic-bezier(0.4, 0, 0.2, 1), top 0.7s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* ──── z:2 — PAGE_BG pill (row background) ──── */}
          <div
            style={{
              position: 'absolute',
              left: 8, // Deep cutout, mathematically perfect with CURVE=30
              right: -GAP,
              top: 0,
              bottom: 0,
              background: pageBg,
              borderRadius: `${ROW_H / 2}px 0 0 ${ROW_H / 2}px`,
              opacity: isActive ? 1 : 0,
              zIndex: 2,
              pointerEvents: 'none',
              transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1), left 0.7s cubic-bezier(0.4, 0, 0.2, 1), right 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* ──── z:3 — Green curve TOP ──── */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: -CURVE,
              width: CURVE,
              height: CURVE,
              background: SIDEBAR,
              borderBottomRightRadius: CURVE,
              opacity: isActive ? 1 : 0,
              zIndex: 3,
              pointerEvents: 'none',
              transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1), left 0.7s cubic-bezier(0.4, 0, 0.2, 1), right 0.7s cubic-bezier(0.4, 0, 0.2, 1), top 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* ──── z:3 — Green curve BOTTOM ──── */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: -CURVE,
              width: CURVE,
              height: CURVE,
              background: SIDEBAR,
              borderTopRightRadius: CURVE,
              opacity: isActive ? 1 : 0,
              zIndex: 3,
              pointerEvents: 'none',
              transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1), left 0.7s cubic-bezier(0.4, 0, 0.2, 1), right 0.7s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </>

        {/* ──── z:10 — Content: icon + label ──── */}
        <div
          className="sidebar-trans"
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            paddingLeft: isActive ? 18 : 12, // Centered perfectly in the left:4 pill
          }}
        >
          {/* Icon — green circle when active */}
          <div style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            borderRadius: '50%',
            background: isActive ? ORANGE : 'transparent',
            transition: 'background 0.2s',
            transform: 'translateZ(0)', // Prevent sub-pixel jitter during open/close
          }}>
            <item.icon
              size={20}
              color={isActive ? pageBg : ICON_OFF}
              strokeWidth={isActive ? 2.5 : 2}
              className="sidebar-trans"
            />
          </div>

          {/* Label */}
          <span
            className="sidebar-trans"
            style={{
              marginLeft: 10,
              fontWeight: 700,
              fontSize: 14,
              whiteSpace: 'nowrap',
              color: isActive ? (pageBg === SIDEBAR ? ORANGE : SIDEBAR) : ICON_OFF,
              opacity: open ? 1 : 0,
              maxWidth: open ? 150 : 0,
              overflow: 'hidden',
            }}
          >
            {item.label}
          </span>
        </div>
      </TooltipTrigger>
      {!open && (
        <TooltipContent side="right" sideOffset={12} className="border-none bg-[#1F3B34] text-[#FAF8F5] font-semibold text-sm">
          {item.label}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export default function Sidebar({ activePage }: SidebarProps) {
  const { user, role, roleData } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isToggleHovered, setIsToggleHovered] = useState(false);
  const navLock = useNavigationLock();

  const [optimisticPath, setOptimisticPath] = useState(pathname);

  const isProfiles = pathname.startsWith('/profiles');
  // Determine dynamic background color for the active curve
  const pageBg = isProfiles ? SIDEBAR : 'var(--bg-app)';

  // Keep it synced if the pathname changes externally
  useEffect(() => {
    setOptimisticPath(pathname);
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().clearSession();
    window.location.href = '/login';
  };

  const visible = navItems.filter(i => role && i.roles.includes(role));
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';
  return (
    <TooltipProvider delay={150}>
      {/* ─── DESKTOP SIDEBAR (visible on md+) ─── */}
      <div className="hidden md:block h-full shrink-0">
        <div
          className="sidebar-trans h-full"
          style={{
            position: 'relative',
            flexShrink: 0,
            width: open ? '232px' : '76px',
            padding: `${GAP}px 0 ${GAP}px ${GAP}px`,   // no right padding
            overflow: 'visible',
          }}
        >
          {/* Green sidebar card — rounded ALL corners, overflow: visible */}
          <aside
            className="sidebar-trans"
            style={{
              width: isProfiles ? '100%' : `calc(100% - ${GAP}px)`,   // expands to fill gap on profiles route
              height: '100%',
              background: SIDEBAR,
              borderRadius: isProfiles ? '28px 0 0 28px' : 28, // straight right edge to connect
              display: 'flex',
              flexDirection: 'column',
              paddingTop: 18,
              paddingBottom: 18,
              /* Removed box-shadow to prevent it from darkening the page background next to the active pill, which caused a visual seam */
              overflow: 'visible',     // CRITICAL — gooey curves must escape
              position: 'relative',
            }}
          >

            {/* ─── Toggle ─── */}
            <div
              className="sidebar-trans"
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 20,
                padding: '0 12px',
              }}
            >
              <div
                className="sidebar-trans flex item-center gap-2" suppressHydrationWarning
                style={{
                  flex: 1,
                  opacity: open ? 1 : 0,
                  maxWidth: open ? 200 : 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                <Image src="/nikah_icon_w.png" alt="nikahkaru_logo" width={35} height={35} suppressHydrationWarning/>
                <span style={{ color: '#ffffff', fontWeight: 600 , fontSize: 17, marginTop:5 , letterSpacing: '-0.3px' }}>
                  Nikah Karu 
                </span>
              </div>
              <button
                onClick={() => setOpen(v => !v)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: ICON_OFF,
                  width: 36,
                  height: 36,
                  padding: 0,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 150ms',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = pageBg;
                  setIsToggleHovered(true);
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = ICON_OFF;
                  setIsToggleHovered(false);
                }}
              >
                {open ? (
                  isToggleHovered ? (
                    <PanelLeftClose
                      size={20}
                      strokeWidth={2}
                      style={{ transition: 'opacity 0.2s', color: '#ffffff' }}
                    />
                  ) : (
                    <PanelLeft
                      size={20}
                      strokeWidth={2}
                      style={{ transition: 'opacity 0.2s' }}
                    />
                  )
                ) : (
                  isToggleHovered ? (
                    <PanelLeftOpen
                      size={20}
                      strokeWidth={2}
                      style={{ transition: 'opacity 0.2s', color: '#ffffff' }}
                    />
                  ) : (
                    <Image src="/nikah_icon_w.png" alt="nikahkaru_logo" width={35} height={35} suppressHydrationWarning/>
                  )
                )}
              </button>
            </div>

            {/* ─── Nav ─── */}
            <nav style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              overflow: 'visible',   // NOT auto — gooey needs to escape
            }}>
              {visible.map(item => {
                const isActive = item.href === '/overview'
                  ? optimisticPath === '/overview' || optimisticPath === '/'
                  : optimisticPath.startsWith(item.href);
                return <NavItem key={item.id} item={item} isActive={isActive} open={open} pageBg={pageBg} onClick={() => flushSync(() => setOptimisticPath(item.href))} />;
              })}
              {role === 'HIGH_LEVEL_ADMIN' && (
                <>
                  <div style={{ height: 1, background: 'rgba(250,248,245,0.08)', margin: '0 16px' }} />
                  {adminItems.map(item => (
                    <NavItem key={item.id} item={item} isActive={optimisticPath.startsWith(item.href)} open={open} pageBg={pageBg} onClick={() => flushSync(() => setOptimisticPath(item.href))} />
                  ))}
                </>
              )}
            </nav>

            {/* ─── Bottom: avatar + logout ─── */}
            <div
              className="sidebar-trans"
              style={{
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: '14px 12px 0 12px',
              }}
            >
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: ORANGE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: pageBg,
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div
                  className="sidebar-trans"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    opacity: open ? 1 : 0,
                    maxWidth: open ? 200 : 0,
                    overflow: 'hidden',
                    marginLeft: 10,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{
                    color: pageBg,
                    fontWeight: 700,
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {user?.full_name || 'Loading...'}
                  </div>
                  <div style={{
                    color: '#A7D5C4',
                    fontWeight: 800,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: 1,
                  }}>
                    {roleData?.name.replace(/_/g, ' ') || 'AGENT'}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <Tooltip>
                <TooltipTrigger render={
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      border: 'none',
                      width: '100%',
                      height: 38,
                      padding: 0,
                      background: 'transparent',
                      color: ICON_OFF,
                      transition: 'color 0.15s',
                      marginBottom: 2,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = pageBg;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = ICON_OFF;
                    }}
                  />
                }>
                  <div style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <LogOut size={16} strokeWidth={2} style={{ transition: 'color 0.15s' }} />
                  </div>
                  <span
                    className="sidebar-trans"
                    style={{
                      marginLeft: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      opacity: open ? 1 : 0,
                      maxWidth: open ? 100 : 0,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Logout
                  </span>
                </TooltipTrigger>
                {!open && (
                  <TooltipContent side="right" sideOffset={12} className="border-none  bg-[#1F3B34] text-[#FAF8F5] font-semibold text-sm">
                    Logout
                  </TooltipContent>
                )}
              </Tooltip>
            </div>

          </aside>
        </div>
      </div>

      {/* ─── MOBILE TOP BAR (visible on < md) ─── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#1F3B34] text-white shrink-0 z-40 shadow-sm w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open Navigation Menu"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Image src="/nikah_icon_w.png" alt="Nikah Karu" width={28} height={28} />
            <span className="font-bold text-[16px] text-white tracking-tight">Nikah Karu</span>
          </div>
        </div>

        {/* User Initials Avatar on right */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#A3B18A] text-[#1F3B34] font-bold text-xs flex items-center justify-center shadow-sm">
            {initials}
          </div>
        </div>
      </div>

      {/* ─── MOBILE DRAWER OVERLAY & PANEL (visible on < md) ─── */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sliding Drawer Panel */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-[290px] max-w-[85vw] bg-[#1F3B34] text-white z-[100] flex flex-col justify-between p-5 shadow-2xl rounded-r-[32px] transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Image src="/nikah_icon_w.png" alt="Nikah Karu" width={32} height={32} />
            <div>
              <div className="font-bold text-[17px] leading-tight text-white">Nikah Karu</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#A3B18A]">Matrimonial CRM</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close Navigation Menu"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 my-2 hide-scrollbar">
          {visible.map((item) => {
            const isActive = item.href === '/overview'
              ? optimisticPath === '/overview' || optimisticPath === '/'
              : optimisticPath.startsWith(item.href);
            const locked = navLock.isLocked() && !isActive;

            return (
              <Link
                key={item.id}
                href={locked ? '#' : item.href}
                onClick={(e) => {
                  if (locked) {
                    e.preventDefault();
                    return;
                  }
                  flushSync(() => setOptimisticPath(item.href));
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-150 text-[14px] ${
                  isActive
                    ? 'bg-[#A3B18A] text-[#1F3B34] font-bold shadow-sm'
                    : 'text-[#fcf3e3] hover:bg-white/10 hover:text-white font-medium'
                } ${locked ? 'opacity-35 pointer-events-none cursor-not-allowed' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-[#1F3B34] text-[#A3B18A]' : 'bg-white/5 text-[#fcf3e3]'
                  }`}
                >
                  <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {role === 'HIGH_LEVEL_ADMIN' && (
            <>
              <div className="my-3 border-t border-white/10" />
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#A3B18A]/80">
                Admin Controls
              </div>
              {adminItems.map((item) => {
                const isActive = optimisticPath.startsWith(item.href);
                const locked = navLock.isLocked() && !isActive;
                return (
                  <Link
                    key={item.id}
                    href={locked ? '#' : item.href}
                    onClick={(e) => {
                      if (locked) {
                        e.preventDefault();
                        return;
                      }
                      flushSync(() => setOptimisticPath(item.href));
                      setMobileOpen(false);
                    }}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-150 text-[14px] ${
                      isActive
                        ? 'bg-[#A3B18A] text-[#1F3B34] font-bold shadow-sm'
                        : 'text-[#fcf3e3] hover:bg-white/10 hover:text-white font-medium'
                    } ${locked ? 'opacity-35 pointer-events-none cursor-not-allowed' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-[#1F3B34] text-[#A3B18A]' : 'bg-white/5 text-[#fcf3e3]'
                      }`}
                    >
                      <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Drawer Footer (User Profile & Logout) */}
        <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-[#A3B18A] text-[#1F3B34] font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-white truncate">
                {user?.full_name || 'Loading...'}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#A3B18A]">
                {roleData?.name.replace(/_/g, ' ') || 'AGENT'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-[#fcf3e3] hover:text-red-200 transition-colors text-[13px] font-semibold mt-1 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
