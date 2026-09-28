'use client';

import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
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
  LogOut,
  PanelLeftClose,
  PanelLeft,
  PanelLeftOpen,
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
  { label: 'Releases', href: '/release-requests', icon: FileCheck, roles: ['MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'release-requests' },
  { label: 'Proposals', href: '/proposals', icon: Send, roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'proposals' },
  { label: 'Feedback', href: '/feedback', icon: MessageSquareWarning, roles: ['AGENT', 'MANAGER', 'HIGH_LEVEL_ADMIN'], id: 'feedback' },
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

  return (
    <Tooltip open={open ? false : tooltipOpen} onOpenChange={setTooltipOpen}>
      <TooltipTrigger render={
        <Link
          href={item.href}
          onClick={onClick}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            height: ROW_H,
            overflow: 'visible',
            textDecoration: 'none',
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
              color: isActive ? SIDEBAR : ICON_OFF,
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
  const [isToggleHovered, setIsToggleHovered] = useState(false);

  const [optimisticPath, setOptimisticPath] = useState(pathname);

  // Determine dynamic background color for the active curve
  const pageBg = pathname.startsWith('/profiles') ? '#FCFDFD' : 'var(--bg-app)';

  // Keep it synced if the pathname changes externally
  useEffect(() => {
    setOptimisticPath(pathname);
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
  /*
    ╔══════════════════════════════════════════════════════════════╗
    ║  LAYOUT                                                     ║
    ║                                                              ║
    ║  ┌─ wrapper (no bg, controls width) ──────────────────────┐  ║
    ║  │  padding: 8 left/top/bottom, 0 right                   │  ║
    ║  │                                                         │  ║
    ║  │  ┌─ aside (green, rounded ALL corners) ─────────┐  ↕GAP│  ║
    ║  │  │                                               │      │  ║
    ║  │  │   overflow: visible                           │      │  ║
    ║  │  │   → gooey elements can escape bounds          │      │  ║
    ║  │  │                                               │      │  ║
    ║  │  └───────────────────────────────────────────────┘      │  ║
    ║  │                                                         │  ║
    ║  └─────────────────────────────────────────────────────────┘  ║
    ║                                                              ║
    ║  The GAP between aside's right edge and wrapper's right edge ║
    ║  shows layout bg (PAGE_BG). Active item's PAGE_BG elements   ║
    ║  extend into this gap → seamless connection to main content. ║
    ╚══════════════════════════════════════════════════════════════╝
  */

  return (
    <TooltipProvider delay={150}>
      <div
        className="sidebar-trans"
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
            width: `calc(100% - ${GAP}px)`,   // leaves GAP on the right
            height: '100%',
            background: SIDEBAR,
            borderRadius: 28,
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
              <span style={{ color: pageBg, fontFamily: 'var(--font-poppins)', fontWeight: 600 , fontSize: 17, marginTop:5 , letterSpacing: '-0.3px' }}>
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
                    style={{ transition: 'opacity 0.2s' }}
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
                    style={{ transition: 'opacity 0.2s' }}
                  />
                ) : (
                  <Image src="/nikah_icon_w.png" alt="nikahkaru_logo" width={35} height={35} suppressHydrationWarning/>
                    
                 
                  // <PanelLeft
                  //   size={20}
                  //   strokeWidth={2}
                  //   style={{ transition: 'opacity 0.2s' }}
                  // />
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
    </TooltipProvider>
  );
}
