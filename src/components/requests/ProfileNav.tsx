import React, { useEffect, useRef } from 'react';
import { UserIcon } from './icons';
import type { RequestItem } from './types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const SECS = [
  ["Basic Information", "Name, age, marital status"],
  ["Physical Attributes", "Height, weight, complexion"],
  ["Education & Profession", "Degrees, jobs, income"],
  ["Religion & Culture", "Religion, sect, caste"],
  ["Location & Residency", "Current & permanent address"],
  ["Family Details", "Parents, siblings, background"],
  ["Lifestyle", "Practice, beard/hijab, smoking"],
  ["Partner Preferences", "Must-have & preferred criteria"]
];

interface ProfileNavProps {
  item: RequestItem;
  activeIndex: number;
  onNavClick: (index: number) => void;
}

export function ProfileNav({ item, activeIndex, onNavClick }: ProfileNavProps) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    
    const activeItem = list.children[activeIndex] as HTMLElement;
    if (activeItem) {
      list.scrollTo({
        top: activeItem.offsetTop - list.clientHeight / 2 + activeItem.clientHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [activeIndex]);

  return (
    <div
      className="md:sticky md:top-[72px] flex flex-col bg-[#323f50] text-[#dfe5ee] rounded-[30px] p-[18px_18px_16px] shadow-[0_18px_40px_rgba(30,40,60,.25)]"
      style={{
        maxHeight: 'calc(var(--sh, 520px) - 104px)',
        minHeight: 300,
      }}
    >
      <div className="flex items-center gap-[12px] pb-[14px] border-b border-[rgba(255,255,255,.12)] shrink-0">
        <div className="w-[46px] h-[46px] rounded-full bg-[#f1ece0] text-[#323f50] flex items-center justify-center shrink-0">
          <UserIcon size={20} />
        </div>
        <div>
          <b className="block text-[14.5px] font-[700] text-white">{item.name}</b>
        </div>
      </div>

      <ol
        ref={listRef}
        className="list-none m-[10px_-6px_0] p-[0_6px] flex-1 min-h-0 overflow-y-auto relative sheet-hidden-scrollbar"
      >
        <div className="absolute left-[21px] top-[14px] bottom-[14px] border-l border-dashed border-[rgba(255,255,255,.28)] pointer-events-none" />
        
        {SECS.map((t, i) => {
          const isActive = i === activeIndex;
          
          return (
            <li
              key={i}
              onClick={() => onNavClick(i)}
              className={`relative flex items-center gap-[12px] p-[8px_8px] rounded-[16px] cursor-pointer transition-colors duration-250
                ${isActive ? 'bg-[rgba(255,255,255,.11)]' : 'hover:bg-[rgba(255,255,255,.06)]'}
              `}
            >
              <div
                className={`w-[30px] h-[30px] rounded-full shrink-0 border flex items-center justify-center text-[12px] font-[600] z-[1] transition-colors duration-250
                  ${isActive
                    ? 'bg-[#f1ece0] border-[#f1ece0] text-[#323f50] shadow-[0_0_0_4px_rgba(241,236,224,.18)]'
                    : 'bg-[#323f50] border-[rgba(255,255,255,.35)] text-[#c4ccd8]'
                  }
                `}
              >
                {i + 1}
              </div>
              <div>
                <b className={`flex items-center gap-[8px] text-[14px] font-[600] ${isActive ? 'text-white' : 'text-[#c9d1dc]'}`}>
                  {t[0]}
                </b>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
