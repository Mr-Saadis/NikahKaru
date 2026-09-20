"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Link as LinkIcon,
  Bell,
  Settings,
  ChevronLeft,
  Menu,
} from "lucide-react";

export function Sidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (v: boolean) => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`${sidebarOpen ? "w-57 absolute md:relative h-full" : "w-17"
        } shrink-0 bg-brand-green border-r border-brand-green/20 transition-all duration-300 flex flex-col shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-50`}
    >
      <div className={`flex items-center border-b border-white/10 relative ${sidebarOpen ? 'h-24 pr-6' : 'h-20 justify-center'}`}>
        {sidebarOpen ? (
          <>
            <Link href="/" className="w-full h-full flex items-center justify-center">
              <Image src="/nikahkaru_logo.png" alt="NikahKaru" width={200} height={200} className="w-full h-full object-contain" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-md hover:bg-white/10 text-white flex items-center justify-center flex-shrink-0 absolute right-2 top-1/2 -translate-y-1/2"
            >
              <ChevronLeft size={20} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-full h-full flex items-center justify-center group relative cursor-pointer"
          >
            {/* Cropped Logo Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-300">
              <div className="w-14 h-14 overflow-hidden relative flex justify-center">
                <Image
                  src="/nikahkaru_logo.png"
                  alt="Icon"
                  width={150}
                  height={150}
                  className="w-14 max-w-none h-auto absolute top-0"
                />
              </div>
            </div>
            {/* Burger Menu on Hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Menu size={24} className="text-white" />
            </div>
          </button>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === "/"} isOpen={sidebarOpen} />
        <NavItem href="/clients" icon={<Users size={20} />} label="Clients" active={pathname.startsWith("/clients")} isOpen={sidebarOpen} />
        <NavItem href="/add-new" icon={<PlusCircle size={20} />} label="Add New" active={pathname.startsWith("/add-new")} isOpen={sidebarOpen} />
        <NavItem href="/matching" icon={<LinkIcon size={20} />} label="Matching" active={pathname.startsWith("/matching")} isOpen={sidebarOpen} />
        <NavItem href="/notifications" icon={<Bell size={20} />} label="Notifications" active={pathname.startsWith("/notifications")} badge="3" isOpen={sidebarOpen} />
        <NavItem href="/settings" icon={<Settings size={20} />} label="Settings" active={pathname.startsWith("/settings")} isOpen={sidebarOpen} />
      </nav>

      <div className={`mt-auto mb-6 mx-auto flex items-center transition-all duration-300 ${sidebarOpen ? 'w-[calc(100%-2rem)] p-3 rounded-xl gap-3 border border-white/5 bg-white/10' : 'w-10 justify-center'}`}>
        <div className="w-10 h-10 rounded-full bg-brand-sand flex items-center justify-center text-brand-green font-bold text-sm shrink-0">
          AS
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">Ali Shah</p>
            <p className="text-xs text-white/70 truncate">Admin</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, badge, isOpen, href }: any) {
  return (
    <Link
      href={href || "#"}
      className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] transition-colors ${active
        ? "bg-white/10 text-white font-medium"
        : "text-white/70 hover:bg-white/5 hover:text-white"
        }`}
      title={!isOpen ? label : ""}
    >
      <div className="flex items-center gap-3">
        <div className={`${active ? "text-white" : "text-white/70"} shrink-0`}>{icon}</div>
        {isOpen && <span className="text-[15px]">{label}</span>}
      </div>
      {isOpen && badge && (
        <span className="bg-[#D1C696] text-[#064e3b] text-[10px] px-2 py-0.5 rounded-full font-semibold leading-tight">
          {badge}
        </span>
      )}
    </Link>
  );
}
