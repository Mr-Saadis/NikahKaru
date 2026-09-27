'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  LogOut,
  Menu,
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
}

/*
  ╔══════════════════════════════════════════════════╗
  ║  DESIGN TOKENS                                   ║
  ╚══════════════════════════════════════════════════╝
*/
const SIDEBAR  = '#064e3b';   // deep forest green
const PAGE_BG  = 'var(--bg-app)';   // warm off-white — MUST match layout bg
const ICON_OFF = '#6B8F80';   // muted icon colour
const ROW_H    = 52;          // nav-row height in px
const CURVE    = 20;          // gooey-curve radius in px
const GAP      = 8;           // space between aside right edge and wrapper right edge

export const navItems = [
  { label: 'Overview',    href: '/overview',         icon: LayoutDashboard,      roles: ['AGENT','MANAGER','HIGH_LEVEL_ADMIN'], id: 'overview'         },
  { label: 'Profiles',    href: '/profiles',         icon: Users,                roles: ['AGENT','MANAGER','HIGH_LEVEL_ADMIN'], id: 'profiles'         },
  { label: 'Add Profile', href: '/add-profile',      icon: UserPlus,             roles: ['AGENT'],                             id: 'add-new'          },
  { label: 'Matching',    href: '/matching',         icon: HeartHandshake,       roles: ['AGENT','MANAGER','HIGH_LEVEL_ADMIN'], id: 'matching'         },
  { label: 'Releases',    href: '/release-requests', icon: FileCheck,            roles: ['MANAGER','HIGH_LEVEL_ADMIN'],         id: 'release-requests' },
  { label: 'Proposals',   href: '/proposals',        icon: Send,                 roles: ['AGENT','MANAGER','HIGH_LEVEL_ADMIN'], id: 'proposals'        },
  { label: 'Feedback',    href: '/feedback',         icon: MessageSquareWarning, roles: ['AGENT','MANAGER','HIGH_LEVEL_ADMIN'], id: 'feedback'         },
];

export const adminItems = [
  { label: 'Users',     href: '/admin/users',     icon: ShieldCheck, roles: ['HIGH_LEVEL_ADMIN'], id: 'admin-users'     },
  { label: 'Analytics', href: '/admin/analytics', icon: LineChart,   roles: ['HIGH_LEVEL_ADMIN'], id: 'admin-analytics' },
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

const NavItem = ({ item, isActive, open }: { item: typeof navItems[0]; isActive: boolean; open: boolean }) => (
  <Link
    href={item.href}
    title={!open ? item.label : undefined}
    style={{
      position       : 'relative',
      display        : 'flex',
      alignItems     : 'center',
      height         : ROW_H,
      overflow       : 'visible',   // gooey curves MUST escape row bounds
      textDecoration : 'none',
    }}
  >
    {/* ──── GOOEY LAYERS (Always rendered, animated via opacity) ──── */}
    <>
      {/* ──── z:1 — PAGE_BG vertical strip (creates notch + gooey area) ──── */}
      <div 
        className="transition-all duration-[800ms] ease-in-out"
        style={{
          position   : 'absolute',
          right      : -GAP,
          top        : -CURVE,
          bottom     : -CURVE,
          width      : CURVE + GAP,
          background : PAGE_BG,
          opacity    : isActive ? 1 : 0,
          zIndex     : 1,
          pointerEvents: 'none',
        }} 
      />

      {/* ──── z:2 — PAGE_BG pill (row background) ──── */}
      <div 
        className="transition-all duration-[800ms] ease-in-out"
        style={{
          position     : 'absolute',
          left         : open ? 10 : 6,
          right        : -GAP,
          top          : 0,
          bottom       : 0,
          background   : PAGE_BG,
          borderRadius : `${ROW_H / 2}px 0 0 ${ROW_H / 2}px`,
          opacity      : isActive ? 1 : 0,
          zIndex       : 2,
          pointerEvents: 'none',
        }} 
      />

      {/* ──── z:3 — Green curve TOP ──── */}
      <div 
        className="transition-all duration-[800ms] ease-in-out"
        style={{
          position                : 'absolute',
          right                   : 0,
          top                     : -CURVE,
          width                   : CURVE,
          height                  : CURVE,
          background              : SIDEBAR,
          borderBottomRightRadius : CURVE,
          opacity                 : isActive ? 1 : 0,
          zIndex                  : 3,
          pointerEvents: 'none',
        }} 
      />

      {/* ──── z:3 — Green curve BOTTOM ──── */}
      <div 
        className="transition-all duration-[800ms] ease-in-out"
        style={{
          position             : 'absolute',
          right                : 0,
          bottom               : -CURVE,
          width                : CURVE,
          height               : CURVE,
          background           : SIDEBAR,
          borderTopRightRadius : CURVE,
          opacity              : isActive ? 1 : 0,
          zIndex               : 3,
          pointerEvents: 'none',
        }} 
      />
    </>

    {/* ──── z:10 — Content: icon + label ──── */}
    <div 
      className="transition-all duration-[800ms] ease-in-out"
      style={{
        position       : 'relative',
        zIndex         : 10,
        display        : 'flex',
        alignItems     : 'center',
        height         : '100%',
        width          : '100%',
        padding        : open ? '0 16px' : '0',
        justifyContent : open ? 'flex-start' : 'center',
      }}
    >
      {/* Icon — green circle when active */}
      <div style={{
        width          : 36,
        height         : 36,
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
        flexShrink     : 0,
        borderRadius   : '50%',
        background     : isActive ? SIDEBAR : 'transparent',
        transition     : 'background 200ms',
      }}>
        <item.icon
          size={20}
          color={isActive ? PAGE_BG : ICON_OFF}
          strokeWidth={isActive ? 2.5 : 2}
          className="transition-all duration-[800ms] ease-in-out"
        />
      </div>

      {/* Label */}
      <span 
        className="transition-all duration-[800ms] ease-in-out"
        style={{
          marginLeft : open ? 10 : 0,
          fontWeight : 700,
          fontSize   : 14,
          whiteSpace : 'nowrap',
          color      : isActive ? SIDEBAR : ICON_OFF,
          opacity    : open ? 1 : 0,
          maxWidth   : open ? 150 : 0,
          overflow   : 'hidden',
          transform  : open ? 'translateX(0)' : 'translateX(-10px)',
        }}
      >
        {item.label}
      </span>
    </div>
  </Link>
);

export default function Sidebar({ activePage }: SidebarProps) {
  const { user, role, roleData } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().clearSession();
    window.location.href = '/login';
  };

  const visible  = navItems.filter(i => role && i.roles.includes(role));
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
    <div 
      className="transition-all duration-[800ms] ease-in-out"
      style={{
        position   : 'relative',
        flexShrink : 0,
        width      : open ? '252px' : '88px',
        padding    : `${GAP}px 0 ${GAP}px ${GAP}px`,   // no right padding
        overflow   : 'visible',
      }}
    >
      {/* Green sidebar card — rounded ALL corners, overflow: visible */}
      <aside 
        className="transition-all duration-[800ms] ease-in-out"
        style={{
          width         : `calc(100% - ${GAP}px)`,   // leaves GAP on the right
          height        : '100%',
          background    : SIDEBAR,
          borderRadius  : 28,
          display       : 'flex',
          flexDirection : 'column',
          paddingTop    : 18,
          paddingBottom : 18,
          /* Removed box-shadow to prevent it from darkening the page background next to the active pill, which caused a visual seam */
          overflow      : 'visible',     // CRITICAL — gooey curves must escape
          position      : 'relative',
        }}
      >

        {/* ─── Toggle ─── */}
        <div style={{
          display        : 'flex',
          alignItems     : 'center',
          marginBottom   : 20,
          padding        : open ? '0 18px' : '0',
          justifyContent : open ? 'space-between' : 'center',
        }}>
          <div 
            className="transition-all duration-[800ms] ease-in-out"
            style={{
              opacity    : open ? 1 : 0,
              maxWidth   : open ? 200 : 0,
              overflow   : 'hidden',
              transform  : open ? 'translateX(0)' : 'translateX(-10px)',
              whiteSpace : 'nowrap'
            }}
          >
            <span style={{ color: PAGE_BG, fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>
              NikaahKaro
            </span>
          </div>
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              background     : 'transparent',
              border         : 'none',
              cursor         : 'pointer',
              color          : ICON_OFF,
              padding        : 8,
              borderRadius   : 8,
              display        : 'flex',
              alignItems     : 'center',
              justifyContent : 'center',
              transition     : 'color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = PAGE_BG)}
            onMouseLeave={e => (e.currentTarget.style.color = ICON_OFF)}
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>

        {/* ─── Nav ─── */}
        <nav style={{
          flex          : 1,
          display       : 'flex',
          flexDirection : 'column',
          overflow      : 'visible',   // NOT auto — gooey needs to escape
        }}>
          {visible.map(item => {
            const isActive = item.href === '/overview'
              ? pathname === '/overview'
              : pathname.startsWith(item.href);
            return <NavItem key={item.id} item={item} isActive={isActive} open={open} />;
          })}
          {role === 'HIGH_LEVEL_ADMIN' && (
            <>
              <div style={{ height: 1, background: 'rgba(250,248,245,0.08)', margin: '6px 16px' }} />
              {adminItems.map(item => (
                <NavItem key={item.id} item={item} isActive={activePage.startsWith(item.id)} open={open} />
              ))}
            </>
          )}
        </nav>

        {/* ─── Bottom: avatar + logout ─── */}
        <div style={{
          marginTop     : 'auto',
          paddingTop    : 14,
          borderTop     : '1px solid rgba(250,248,245,0.08)',
          display       : 'flex',
          flexDirection : 'column',
          gap           : 10,
          padding       : open ? '14px 18px 0' : '14px 0 0',
          alignItems    : open ? 'stretch' : 'center',
        }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width          : 38,
              height         : 38,
              borderRadius   : '50%',
              background     : 'linear-gradient(135deg, #A7D5C4, #6B8F80)',
              display        : 'flex',
              alignItems     : 'center',
              justifyContent : 'center',
              color          : PAGE_BG,
              fontWeight     : 800,
              fontSize       : 14,
              flexShrink     : 0,
            }}>
              {initials}
            </div>
            <div 
              className="transition-all duration-[800ms] ease-in-out"
              style={{
                flex         : 1, 
                minWidth     : 0,
                opacity      : open ? 1 : 0,
                maxWidth     : open ? 200 : 0,
                overflow     : 'hidden',
                transform    : open ? 'translateX(0)' : 'translateX(-10px)',
                marginLeft   : open ? 10 : 0,
              }}
            >
              <div style={{
                color        : PAGE_BG,
                fontWeight   : 700,
                fontSize     : 13,
                overflow     : 'hidden',
                textOverflow : 'ellipsis',
                whiteSpace   : 'nowrap',
              }}>
                {user?.full_name || 'Loading...'}
              </div>
              <div style={{
                color          : '#A7D5C4',
                fontWeight     : 800,
                fontSize       : 10,
                textTransform  : 'uppercase',
                letterSpacing  : '0.08em',
                marginTop      : 1,
              }}>
                {roleData?.name.replace(/_/g, ' ') || 'AGENT'}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              display        : 'flex',
              alignItems     : 'center',
              cursor         : 'pointer',
              border         : 'none',
              width          : open ? '100%' : 38,
              height         : 38,
              padding        : open ? '0 12px' : '0',
              justifyContent : open ? 'flex-start' : 'center',
              background     : 'rgba(250,248,245,0.06)',
              borderRadius   : 10,
              color          : ICON_OFF,
              transition     : 'background 150ms, color 150ms',
              marginBottom   : 2,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(250,248,245,0.15)';
              e.currentTarget.style.color = PAGE_BG;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(250,248,245,0.06)';
              e.currentTarget.style.color = ICON_OFF;
            }}
          >
            <LogOut size={18} strokeWidth={2} style={{ transition: 'color 150ms' }} />
            <span 
              className="transition-all duration-[800ms] ease-in-out"
              style={{ 
                marginLeft : open ? 10 : 0, 
                fontWeight : 700, 
                fontSize   : 13,
                opacity    : open ? 1 : 0,
                maxWidth   : open ? 100 : 0,
                overflow   : 'hidden',
                transform  : open ? 'translateX(0)' : 'translateX(-10px)',
              }}
            >
              Logout
            </span>
          </button>
        </div>

      </aside>
    </div>
  );
}
