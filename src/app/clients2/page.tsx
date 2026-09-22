"use client";

import React, { useState } from 'react';
import { Plus_Jakarta_Sans } from "next/font/google";
import Sidebar2 from "../../components2/Sidebar2";
import ClientsHeader from "@/components2/clients2/ClientsHeader";
import ClientsFilterBar from "@/components2/clients2/ClientsFilterBar";
import ClientsQueueList from "@/components2/clients2/ClientsQueueList";
import ClientsDetailView from "@/components2/clients2/ClientsDetailView";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function Clients2Page() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className={`fixed inset-0 z-50 flex flex-col md:flex-row bg-[#FAF8F5] text-[#1E2022] ${plusJakartaSans.className} antialiased overflow-hidden`}>
      <style dangerouslySetInnerHTML={{__html: `
        /* Subtle custom scrollbars */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #e2dcd2;
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #c8c0b4;
        }
      `}} />

      {/* BEGIN: LeftSidebar (Using the exact same sidebar from client2/overview2) */}
      <Sidebar2 activePage="release-requests" />
      
      {/* BEGIN: MainContentArea */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F4EFE7]">
        {/* TOP GLOBAL HEADER */}
        <ClientsHeader />

        {/* RECORD FILTER BAR */}
        <ClientsFilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* MASTER-DETAIL SPLIT WORKBENCH */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* LEFT COLUMN: COMPACT QUEUE LIST (~38% Width) */}
          <ClientsQueueList selectedIndex={selectedIndex} onSelect={setSelectedIndex} activeFilter={activeFilter} />

          {/* RIGHT PANEL: DETAILED RECORD VIEW (~62% Width) */}
          <ClientsDetailView selectedIndex={selectedIndex} />
        </div>
      </main>
      {/* END: MainContentArea */}
    </div>
  );
}
