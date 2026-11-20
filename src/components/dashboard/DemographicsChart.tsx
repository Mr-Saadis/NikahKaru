'use client';

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  GraduationCap,
  MapPin,
  Moon,
  Coins,
  ChevronDown,
  Users,
} from 'lucide-react';
import type { DemographicsItem } from '@/lib/services/dashboard-service';

export type DemographicFilterType = 'OCCUPATION' | 'EDUCATION' | 'LOCATION' | 'SECT' | 'INCOME';

interface DemographicsChartProps {
  demographics?: {
    occupations: DemographicsItem[];
    educations: DemographicsItem[];
    locationsCountry: DemographicsItem[];
    locationsProvince: DemographicsItem[];
    sects: DemographicsItem[];
    incomes: DemographicsItem[];
  };
}

export default function DemographicsChart({ demographics }: DemographicsChartProps) {
  // Default to OCCUPATION as requested by the user
  const [activeFilter, setActiveFilter] = useState<DemographicFilterType>('OCCUPATION');
  const [locationView, setLocationView] = useState<'PROVINCE' | 'COUNTRY'>('PROVINCE');
  const [hoveredItem, setHoveredItem] = useState<{
    item: DemographicsItem;
    x: number;
    y: number;
  } | null>(null);

  const activeItems = useMemo(() => {
    if (!demographics) return [];

    switch (activeFilter) {
      case 'OCCUPATION':
        return demographics.occupations || [];
      case 'EDUCATION':
        return demographics.educations || [];
      case 'LOCATION':
        return locationView === 'PROVINCE'
          ? demographics.locationsProvince || []
          : demographics.locationsCountry || [];
      case 'SECT':
        return demographics.sects || [];
      case 'INCOME':
        return demographics.incomes || [];
      default:
        return [];
    }
  }, [demographics, activeFilter, locationView]);

  // Calculations for scale and average
  const maxTotal = useMemo(() => {
    if (activeItems.length === 0) return 10;
    const max = Math.max(...activeItems.map((i) => i.total));
    return max > 0 ? max : 10;
  }, [activeItems]);

  const poolSummary = useMemo(() => {
    let tot = 0;
    let m = 0;
    let f = 0;
    activeItems.forEach((i) => {
      tot += i.total;
      m += i.male;
      f += i.female;
    });
    const avg = activeItems.length > 0 ? Math.round(tot / activeItems.length) : 0;
    return { total: tot, male: m, female: f, avg };
  }, [activeItems]);

  // Scale markers for header axis (like 0, avg, 25%, 50%, 75%, max)
  const avgPct = maxTotal > 0 ? (poolSummary.avg / maxTotal) * 100 : 0;

  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#E9E4DC] shadow-xs space-y-6 relative">
      
      {/* ════════════════════════════════════════════════════════════════
      {/* ════════════════════════════════════════════════════════════════
          CARD HEADER: TITLE & TOP POOL METRICS
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0EBE2] pb-5">
        
        {/* Title and Description */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[17px] font-bold text-[#1F3B34] tracking-tight">
              Pool Demographics Breakdown
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E9E4DC] text-[#7D766C]">
              {activeItems.length} Categories
            </span>
          </div>
          <p className="text-[12px] text-[#7D766C]">
            Visual profile distribution across key partner dimensions with real male & female counts
          </p>
        </div>

        {/* Top Pool Metrics Pill Card */}
        <div className="bg-[#FAF8F5] px-3 py-2 sm:px-4 rounded-[18px] border border-[#E9E4DC] flex items-center justify-between sm:justify-start gap-3 sm:gap-5 shrink-0 w-full sm:w-auto">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] block">
              Total Pool
            </span>
            <span className="text-[18px] font-extrabold text-[#1F3B34] leading-none">
              {poolSummary.total}
            </span>
          </div>
          <div className="h-6 w-px bg-[#E9E4DC]" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] flex items-center gap-1.5 leading-none">
              <span className="w-2 h-2 rounded-full bg-[#1F3B34]" />
              Male
            </span>
            <span className="text-[18px] font-extrabold text-[#1F3B34] leading-none mt-1 block">
              {poolSummary.male}
            </span>
          </div>
          <div className="h-6 w-px bg-[#E9E4DC]" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D766C] flex items-center gap-1.5 leading-none">
              <span className="w-2 h-2 rounded-full bg-[#C86A4A]" />
              Female
            </span>
            <span className="text-[18px] font-extrabold text-[#C86A4A] leading-none mt-1 block">
              {poolSummary.female}
            </span>
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          FILTER BAR (Single Line, Never Wraps Inside Pill, Sleek Sub-toggle)
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Main 5 Filter Pills (wrap compactly on mobile, single pill bar on sm+) */}
        <div className="w-full sm:w-auto">
          <div className="bg-[#FAF8F5] p-1 rounded-2xl sm:rounded-full flex flex-wrap sm:inline-flex items-center border border-[#E9E4DC] gap-1">
            
            {/* 1. Occupation (Default) */}
            <button
              onClick={() => setActiveFilter('OCCUPATION')}
              className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'OCCUPATION'
                  ? 'bg-[#1F3B34] text-white shadow-xs'
                  : 'text-[#7D766C] hover:text-[#1F3B34]'
              }`}
            >
              <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Occupation</span>
            </button>

            {/* 2. Education */}
            <button
              onClick={() => setActiveFilter('EDUCATION')}
              className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'EDUCATION'
                  ? 'bg-[#1F3B34] text-white shadow-xs'
                  : 'text-[#7D766C] hover:text-[#1F3B34]'
              }`}
            >
              <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Education</span>
            </button>

            {/* 3. Location */}
            <button
              onClick={() => setActiveFilter('LOCATION')}
              className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'LOCATION'
                  ? 'bg-[#1F3B34] text-white shadow-xs'
                  : 'text-[#7D766C] hover:text-[#1F3B34]'
              }`}
            >
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Location</span>
            </button>

            {/* 4. Sect */}
            <button
              onClick={() => setActiveFilter('SECT')}
              className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'SECT'
                  ? 'bg-[#1F3B34] text-white shadow-xs'
                  : 'text-[#7D766C] hover:text-[#1F3B34]'
              }`}
            >
              <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Sect</span>
            </button>

            {/* 5. Income */}
            <button
              onClick={() => setActiveFilter('INCOME')}
              className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'INCOME'
                  ? 'bg-[#1F3B34] text-white shadow-xs'
                  : 'text-[#7D766C] hover:text-[#1F3B34]'
              }`}
            >
              <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Income</span>
            </button>
          </div>
        </div>

        {/* Location Sub-toggle (Only appears when Location is selected) */}
        {activeFilter === 'LOCATION' && (
          <div className="bg-[#FAF8F5] p-1 rounded-full inline-flex items-center border border-[#E9E4DC] text-[11px] self-start md:self-auto shrink-0 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setLocationView('PROVINCE')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                locationView === 'PROVINCE'
                  ? 'bg-[#2F3E51] text-white shadow-xs'
                  : 'text-[#7D766C] hover:text-[#1E2022]'
              }`}
            >
              Pakistan (Provinces)
            </button>
            <button
              onClick={() => setLocationView('COUNTRY')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                locationView === 'COUNTRY'
                  ? 'bg-[#2F3E51] text-white shadow-xs'
                  : 'text-[#7D766C] hover:text-[#1E2022]'
              }`}
            >
              Countries (Global)
            </button>
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════════════
          CHART CONTAINER (Horizontally scrollable on mobile, full-width on tablet/desktop)
      ════════════════════════════════════════════════════════════════ */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="min-w-[540px] space-y-3 relative">
        
        {/* Top Axis Ruler: 0, AVG line, and Scale Markers */}
        <div className="flex items-center text-[10.5px] font-bold text-[#A49C8F] select-none pl-[127px] sm:pl-[210px] pr-10 sm:pr-14 relative">
          <div className="w-full flex justify-between relative">
            <span>0</span>
            
            {/* Average Indicator with guideline */}
            {avgPct > 5 && avgPct < 90 && (
              <div
                className="absolute -top-1 flex flex-col items-center -translate-x-1/2 pointer-events-none"
                style={{ left: `${avgPct}%` }}
              >
                <span className="text-[10px] font-bold text-[#D4AF37] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E9E4DC]">
                  AVG {poolSummary.avg}
                </span>
              </div>
            )}

            <span>{Math.round(maxTotal * 0.33)}</span>
            <span>{Math.round(maxTotal * 0.66)}</span>
            <span>{maxTotal} MAX</span>
          </div>
        </div>

        {/* Vertical Dotted Guideline for Average (Matches screenshot) */}
        {avgPct > 5 && avgPct < 90 && (
          <div
            className="absolute top-6 bottom-0 w-px border-l-2 border-dotted border-[#D4AF37]/50 pointer-events-none z-10 hidden sm:block"
            style={{ left: `calc(210px + (100% - 210px - 56px) * ${avgPct / 100})` }}
          />
        )}

        {/* The Bars List */}
        {activeItems.length === 0 ? (
          <div className="py-12 text-center rounded-[18px] bg-[#FAF8F5] border border-dashed border-[#E5DFD3]">
            <p className="text-[13px] font-semibold text-[#5C5449]">
              No real profile data recorded for this category yet.
            </p>
            <p className="text-[11.5px] text-[#8D867C] mt-1">
              Counts appear here automatically once active profiles include this detail.
            </p>
          </div>
        ) : (
        <div className="space-y-3 pt-1 max-h-[460px] overflow-y-auto pr-1">
          {activeItems.map((item, index) => {
            const barWidthPct = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
            const maleWidthPct = item.total > 0 ? (item.male / item.total) * 100 : 0;
            const femaleWidthPct = 100 - maleWidthPct;

            return (
              <div
                key={item.id || index}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredItem({
                    item,
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  });
                }}
                onMouseLeave={() => setHoveredItem(null)}
                className="group flex items-center gap-3 text-[12.5px] py-1 cursor-pointer transition-colors"
              >
                {/* Category Label (Left column, compact on mobile, full on desktop) */}
                <div className="w-[115px] sm:w-[195px] shrink-0 text-right pr-2">
                  <span className="font-semibold text-[#1E2022] group-hover:text-[#1F3B34] transition-colors truncate block text-[12px] sm:text-[13px]">
                    {item.name}
                  </span>
                </div>

                {/* Horizontal Capsule Track */}
                <div className="flex-1 bg-[#F4EFE7] h-6 rounded-full relative flex items-center p-0.5 border border-[#EBE4D8] overflow-hidden group-hover:border-[#1F3B34]/40 transition-colors">
                  
                  {/* The filled bar (Dual Capsule: Pine Green for Male, Terracotta for Female) */}
                  <div
                    className="h-full rounded-full flex overflow-hidden transition-all duration-700 ease-out shadow-xs"
                    style={{ width: `${Math.max(barWidthPct, 4)}%` }}
                  >
                    {/* Male Segment */}
                    {item.male > 0 && (
                      <div
                        className="h-full bg-[#1F3B34] transition-all hover:brightness-110"
                        style={{ width: `${maleWidthPct}%` }}
                        title={`Male: ${item.male}`}
                      />
                    )}
                    {/* Female Segment */}
                    {item.female > 0 && (
                      <div
                        className="h-full bg-[#C86A4A] transition-all hover:brightness-110"
                        style={{ width: `${femaleWidthPct}%` }}
                        title={`Female: ${item.female}`}
                      />
                    )}
                  </div>

                  {/* Inline micro text inside bar if wide enough */}
                  {barWidthPct > 28 && (
                    <div className="absolute left-3 text-[10px] font-bold text-white drop-shadow-xs pointer-events-none flex items-center gap-2">
                      <span>{item.male}M</span>
                      <span>•</span>
                      <span>{item.female}F</span>
                    </div>
                  )}
                </div>

                {/* Right Count Label (Matches screenshot '6354 PRJS') */}
                <div className="w-14 shrink-0 text-left">
                  <span className="font-mono text-[11.5px] font-bold text-[#1F3B34] group-hover:text-[#166534]">
                    {item.total}{' '}
                    <span className="text-[9.5px] font-semibold text-[#7D766C]">PRFS</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          FLOATING TOOLTIP POPOVER (Matches the popover in user's screenshot)
      ════════════════════════════════════════════════════════════════ */}
      {hoveredItem && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-[115%] transition-all duration-150 animate-in fade-in zoom-in-95"
          style={{
            left: `${hoveredItem.x}px`,
            top: `${hoveredItem.y}px`,
          }}
        >
          <div className="bg-white rounded-[20px] p-4 border border-[#E9E4DC] shadow-xl min-w-[230px] space-y-2.5">
            {/* Header / Category Title */}
            <div className="border-b border-[#F0EBE2] pb-2">
              <span className="font-bold text-[13.5px] text-[#1F3B34] block">
                {hoveredItem.item.name}
              </span>
              <span className="text-[10px] font-medium text-[#7D766C]">
                Demographics Breakdown
              </span>
            </div>

            {/* Metrics List (Projects, Donations, Collected in screenshot) */}
            <div className="space-y-1.5 text-[11.5px]">
              <div className="flex items-center justify-between">
                <span className="text-[#7D766C]">Total Profiles</span>
                <span className="font-extrabold text-[#1E2022] font-mono">
                  {hoveredItem.item.total}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#7D766C] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1F3B34]" />
                  Male Candidates
                </span>
                <span className="font-bold text-[#1F3B34] font-mono">
                  {hoveredItem.item.male}{' '}
                  <span className="text-[10px] font-medium text-[#7D766C]">
                    ({hoveredItem.item.total > 0 ? Math.round((hoveredItem.item.male / hoveredItem.item.total) * 100) : 0}%)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#7D766C] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C86A4A]" />
                  Female Candidates
                </span>
                <span className="font-bold text-[#C86A4A] font-mono">
                  {hoveredItem.item.female}{' '}
                  <span className="text-[10px] font-medium text-[#7D766C]">
                    ({hoveredItem.item.total > 0 ? Math.round((hoveredItem.item.female / hoveredItem.item.total) * 100) : 0}%)
                  </span>
                </span>
              </div>

              <div className="pt-1.5 border-t border-[#F0EBE2] flex items-center justify-between text-[10.5px]">
                <span className="text-[#7D766C]">Share of Pool</span>
                <span className="font-bold text-[#1F3B34] font-mono">
                  {poolSummary.total > 0
                    ? Math.round((hoveredItem.item.total / poolSummary.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          BOTTOM LEGEND & FOOTNOTE
      ════════════════════════════════════════════════════════════════ */}
      <div className="pt-3 border-t border-[#F0EBE2] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#7D766C]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#1F3B34]" />
            <span className="font-medium text-[#1E2022]">Male Profiles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#C86A4A]" />
            <span className="font-medium text-[#1E2022]">Female Profiles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 border-t-2 border-dotted border-[#D4AF37]" />
            <span>Average Line</span>
          </div>
        </div>

        <span className="italic text-[#A49C8F]">
          *Hover over any bar to inspect gender ratio & pool share
        </span>
      </div>

    </div>
  );
}
