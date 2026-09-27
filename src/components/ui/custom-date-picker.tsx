'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface CustomDatePickerProps {
  value: string;          // YYYY-MM-DD or ''
  onChange: (val: string) => void;
  placeholder?: string;
}

/** Parse flexible user input into a Date or null */
function parseFlexibleDate(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;

  // Try dd/mm/yyyy or dd-mm-yyyy
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const d = parseInt(slashMatch[1], 10);
    const m = parseInt(slashMatch[2], 10) - 1;
    const y = parseInt(slashMatch[3], 10);
    const dt = new Date(y, m, d);
    if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) return dt;
  }

  // Try "20 feb 2000" style
  const textMatch = s.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (textMatch) {
    const d = parseInt(textMatch[1], 10);
    const mStr = textMatch[2].toLowerCase().slice(0, 3);
    const mIdx = MONTH_SHORT.findIndex((m) => m.toLowerCase() === mStr);
    const y = parseInt(textMatch[3], 10);
    if (mIdx !== -1) {
      const dt = new Date(y, mIdx, d);
      if (dt.getFullYear() === y && dt.getMonth() === mIdx && dt.getDate() === d) return dt;
    }
  }

  // Try yyyy-mm-dd
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dt = new Date(y, m, d);
    if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) return dt;
  }

  return null;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(ymd: string): string {
  if (!ymd) return '';
  const d = new Date(ymd);
  if (isNaN(d.getTime())) return ymd;
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MIN_YEAR = 1950;
const MAX_YEAR = new Date().getFullYear();

export default function CustomDatePicker({ value, onChange, placeholder = 'dd/mm/yyyy' }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState(value ? formatDisplay(value) : '');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Calendar navigation state
  const initialDate = value ? new Date(value) : new Date(2000, 0, 1);
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());

  const containerRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  // Sync inputText when value prop changes externally
  useEffect(() => {
    setInputText(value ? formatDisplay(value) : '');
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll year list to current viewYear when year picker opens
  useEffect(() => {
    if (showYearPicker && yearListRef.current) {
      const activeEl = yearListRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }
  }, [showYearPicker]);

  const handleInputBlur = () => {
    const parsed = parseFlexibleDate(inputText);
    if (parsed && parsed.getFullYear() >= MIN_YEAR && parsed.getFullYear() <= MAX_YEAR) {
      const ymd = toYMD(parsed);
      onChange(ymd);
      setInputText(formatDisplay(ymd));
      setViewMonth(parsed.getMonth());
      setViewYear(parsed.getFullYear());
    } else if (inputText.trim() === '') {
      onChange('');
      setInputText('');
    } else {
      // Revert to last valid
      setInputText(value ? formatDisplay(value) : '');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      setIsOpen(false);
    }
  };

  const selectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const ymd = toYMD(d);
    onChange(ymd);
    setInputText(formatDisplay(ymd));
    setIsOpen(false);
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  const selectMonth = (m: number) => {
    setViewMonth(m);
    setShowMonthPicker(false);
  };

  const selectYear = (y: number) => {
    setViewYear(y);
    setShowYearPicker(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => Math.max(MIN_YEAR, y - 1)); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => Math.min(MAX_YEAR, y + 1)); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const prevDays = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);

  const selectedDate = value ? new Date(value) : null;
  const today = new Date();

  // Build 6-row grid
  const cells: { day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: prevDays - firstDay + 1 + i, inMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, inMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, inMonth: false });
  }

  const isSelected = (day: number) =>
    selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getFullYear() === viewYear;

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  return (
    <div ref={containerRef} className="relative">
      {/* Input row */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className={`w-full h-[46px] bg-white border border-[#EFE9DF] rounded-xl pl-4 pr-11 py-3 text-[13px] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all ${
            !inputText ? 'text-[#A8A296]' : 'text-[#24211D]'
          }`}
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setShowMonthPicker(false);
            setShowYearPicker(false);
            // Reset to selected date or default
            if (value) {
              const d = new Date(value);
              setViewMonth(d.getMonth());
              setViewYear(d.getFullYear());
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#888174] hover:text-[#064e3b] hover:bg-[#E5EFE9]/50 transition-all"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-[300px] bg-white border border-[#EFE9DF] rounded-2xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">

          {/* Header: nav arrows + month/year selectors */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F4ECE1] text-[#676156] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
              {/* Month button */}
              <button
                type="button"
                onClick={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }}
                className={`px-2.5 py-1 rounded-lg text-[13px] font-semibold transition-colors ${
                  showMonthPicker
                    ? 'bg-[#064e3b] text-white'
                    : 'text-[#24211D] hover:bg-[#F4ECE1]'
                }`}
              >
                {MONTHS[viewMonth]}
              </button>

              {/* Year button */}
              <button
                type="button"
                onClick={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }}
                className={`px-2.5 py-1 rounded-lg text-[13px] font-semibold transition-colors ${
                  showYearPicker
                    ? 'bg-[#064e3b] text-white'
                    : 'text-[#24211D] hover:bg-[#F4ECE1]'
                }`}
              >
                {viewYear}
              </button>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F4ECE1] text-[#676156] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month picker grid */}
          {showMonthPicker && (
            <div className="px-3 pb-3">
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectMonth(i)}
                    className={`py-2 rounded-xl text-[12px] font-medium transition-all ${
                      i === viewMonth
                        ? 'bg-[#064e3b] text-white shadow-sm'
                        : 'text-[#4E473D] hover:bg-[#F4ECE1]'
                    }`}
                  >
                    {MONTH_SHORT[i]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Year picker list — shows 5 visible, rest scroll */}
          {showYearPicker && (
            <div className="px-3 pb-3">
              <div
                ref={yearListRef}
                className="max-h-[180px] overflow-y-auto rounded-xl border border-[#EFE9DF] custom-scrollbar"
              >
                <div className="grid grid-cols-4 gap-1 p-2">
                  {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i).map((y) => (
                    <button
                      key={y}
                      type="button"
                      data-active={y === viewYear ? 'true' : 'false'}
                      onClick={() => selectYear(y)}
                      className={`py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                        y === viewYear
                          ? 'bg-[#064e3b] text-white shadow-sm'
                          : 'text-[#4E473D] hover:bg-[#F4ECE1]'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Calendar grid (hidden when month/year pickers are open) */}
          {!showMonthPicker && !showYearPicker && (
            <div className="px-3 pb-3">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-[#A8A296] uppercase tracking-wide py-1.5">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((cell, idx) => {
                  if (!cell.inMonth) {
                    return (
                      <div key={idx} className="w-full aspect-square flex items-center justify-center text-[12px] text-[#D5D0C8]">
                        {cell.day}
                      </div>
                    );
                  }
                  const selected = isSelected(cell.day);
                  const todayCell = isToday(cell.day);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectDay(cell.day)}
                      className={`w-full aspect-square flex items-center justify-center text-[12px] font-medium rounded-lg transition-all ${
                        selected
                          ? 'bg-[#064e3b] text-white shadow-sm'
                          : todayCell
                          ? 'bg-[#FEF3C7] text-[#9A6014] font-bold'
                          : 'text-[#4E473D] hover:bg-[#F4ECE1]'
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Today shortcut */}
              <div className="mt-2 pt-2 border-t border-[#EFE9DF] flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const t = new Date();
                    setViewMonth(t.getMonth());
                    setViewYear(t.getFullYear());
                  }}
                  className="text-[11px] font-semibold text-[#064e3b] hover:text-[#0a7c5e] transition-colors"
                >
                  Today
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #F7F3EA; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #D5D0C8; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #A8A296; }
      `}} />
    </div>
  );
}
