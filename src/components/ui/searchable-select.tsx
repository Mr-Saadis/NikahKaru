"use client"

import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon, CheckIcon, Search, X } from "lucide-react"

export interface SearchableSelectProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  direction?: 'up' | 'down'
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  disabled,
  direction = 'down'
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-xl border border-[#EFE9DF] bg-white py-2 pr-2 pl-4 text-[13px] text-[#24211D] transition-colors outline-none h-[46px] shadow-none focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={cn("truncate flex-1 text-left", !selectedOption && "text-[#A8A296]")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && !disabled && (
            <div
              role="button"
              tabIndex={0}
              className="p-0.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer text-red-400 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
            >
              <X className="size-3.5" />
            </div>
          )}
          <ChevronDownIcon className="size-4 opacity-50" />
        </div>
      </button>

      {open && (
        <div 
          className={cn(
            "absolute z-50 w-full rounded-xl border border-[#EFE9DF] bg-white text-[#24211D] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] outline-none animate-in fade-in-0 zoom-in-95",
            direction === 'up' ? "bottom-[100%] mb-1" : "mt-1"
          )}
        >
          <div className="flex items-center border-b border-[#EFE9DF] px-3">
            <Search className="mr-2 size-4 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-[42px] w-full rounded-md bg-transparent py-3 text-[13px] outline-none placeholder:text-[#A8A296] disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1.5 scroll-smooth custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <p className="p-4 text-center text-[13px] text-[#A8A296]">No results found.</p>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setSearch("")
                    setOpen(false)
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-2 text-[13px] outline-none hover:bg-[#F7FAF8] hover:text-[#064e3b] transition-colors",
                    value === opt.value && "bg-[#F7FAF8] text-[#064e3b] font-semibold"
                  )}
                >
                  {value === opt.value && (
                    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                      <CheckIcon className="size-3.5" />
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
