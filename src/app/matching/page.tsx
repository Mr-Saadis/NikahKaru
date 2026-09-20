"use client";

import { useState } from "react";
import { Eye, Clock, Send, Sparkles, Search, ChevronRight, User, Check, ArrowRight, Heart, Book, Briefcase, Wallet, MoreHorizontal } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  age: number;
  city: string;
  status: "Active" | "Pending";
}

interface MatchData {
  id: string;
  name: string;
  gender: "male" | "female";
  age: number;
  city: string;
  tags: { marital: string; education: string; profession: string; income: string };
  matchPercentage: number;
  keyMatches: { name: string; percentage: number }[];
  extraMatchesCount: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockClients: Client[] = [
  { id: "1", name: "Muhammad Ahmed", age: 29, city: "Lahore", status: "Active" },
  { id: "2", name: "Ayesha Khan", age: 27, city: "Islamabad", status: "Active" },
  { id: "3", name: "Usman Tariq", age: 33, city: "Karachi", status: "Pending" },
  { id: "4", name: "Sara Raza", age: 31, city: "Lahore", status: "Active" },
  { id: "5", name: "Hamza Ali", age: 26, city: "Faisalabad", status: "Active" },
  { id: "6", name: "Zainab Fatima", age: 28, city: "Multan", status: "Active" },
  { id: "7", name: "Bilal Khan", age: 32, city: "Peshawar", status: "Pending" },
  { id: "8", name: "Fatima Noor", age: 30, city: "Rawalpindi", status: "Active" },
  { id: "9", name: "Kamran Ali", age: 29, city: "Lahore", status: "Pending" },
  { id: "10", name: "Nida Yousaf", age: 25, city: "Islamabad", status: "Active" },
];

const mockMatches: MatchData[] = [
  {
    id: "m1", name: "Ayesha Khan", gender: "female", age: 27, city: "Islamabad",
    tags: { marital: "Never Married", education: "Masters", profession: "Teacher", income: "PKR 80k - 120k" },
    matchPercentage: 86,
    keyMatches: [{ name: "Age", percentage: 92 }, { name: "Education", percentage: 90 }, { name: "Religion", percentage: 100 }],
    extraMatchesCount: 3,
  },
  {
    id: "m2", name: "Sara Raza", gender: "female", age: 31, city: "Lahore",
    tags: { marital: "Never Married", education: "Bachelors", profession: "Software Engineer", income: "PKR 100k - 150k" },
    matchPercentage: 82,
    keyMatches: [{ name: "Education", percentage: 88 }, { name: "Profession", percentage: 85 }, { name: "Location", percentage: 78 }],
    extraMatchesCount: 2,
  },
  {
    id: "m3", name: "Hira Ali", gender: "female", age: 26, city: "Faisalabad",
    tags: { marital: "Never Married", education: "Masters", profession: "Doctor", income: "PKR 120k - 180k" },
    matchPercentage: 78,
    keyMatches: [{ name: "Age", percentage: 85 }, { name: "Religion", percentage: 92 }, { name: "Family", percentage: 76 }],
    extraMatchesCount: 2,
  },
  {
    id: "m4", name: "Fatima Noor", gender: "female", age: 30, city: "Rawalpindi",
    tags: { marital: "Never Married", education: "Bachelors", profession: "Marketing Manager", income: "PKR 70k - 100k" },
    matchPercentage: 75,
    keyMatches: [{ name: "Education", percentage: 80 }, { name: "Profession", percentage: 72 }, { name: "Location", percentage: 70 }],
    extraMatchesCount: 2,
  },
  {
    id: "m5", name: "Zainab Khan", gender: "female", age: 28, city: "Multan",
    tags: { marital: "Never Married", education: "Masters", profession: "Architect", income: "PKR 90k - 140k" },
    matchPercentage: 71,
    keyMatches: [{ name: "Age", percentage: 78 }, { name: "Education", percentage: 75 }, { name: "Lifestyle", percentage: 68 }],
    extraMatchesCount: 2,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

// ─── Match Circle ─────────────────────────────────────────────────────────────

function MatchCircle({ pct }: { pct: number }) {
  const r = 26, circ = 2 * Math.PI * r;
  return (
    <div className="relative w-[72px] h-[72px] flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} stroke="#e5e7eb" strokeWidth="4" fill="none" />
        <circle cx="36" cy="36" r={r} stroke="#064e3b" strokeWidth="4" fill="none"
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center mt-0.5">
        <p className="text-[14px] font-bold text-gray-900 leading-none">{pct}%</p>
        <p className="text-[9px] text-gray-400 font-medium mt-0.5">Match</p>
      </div>
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ data, selected, onSelect }: { data: MatchData; selected: boolean; onSelect: () => void }) {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-center gap-5 py-5 border-b border-gray-100 last:border-0 transition-all ${selected ? "bg-[#f3f9f6] -mx-4 px-4 rounded-xl" : ""}`}>

      {/* Checkbox + Avatar + Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={onSelect}
          className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border-2 transition-colors ${selected ? "bg-brand-green border-brand-green" : "border-gray-300 hover:border-brand-green"}`}
        >
          {selected && <Check size={11} strokeWidth={3} className="text-white" />}
        </button>

        <div className="w-12 h-12 rounded-full shrink-0 bg-brand-green/10 flex items-center justify-center text-brand-green text-sm font-bold">
          {getInitials(data.name)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[14px] font-semibold text-gray-900 truncate">{data.name}</h3>
            <span className="text-gray-400 text-xs">{data.gender === "female" ? "♀" : "♂"}</span>
          </div>
          <p className="text-[12px] text-gray-500">{data.age} years • {data.city}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <span className="flex items-center gap-1 text-[11px] text-gray-500"><Heart size={10} className="text-gray-400" /> {data.tags.marital}</span>
            <span className="flex items-center gap-1 text-[11px] text-gray-500"><Book size={10} className="text-gray-400" /> {data.tags.education}</span>
            <span className="flex items-center gap-1 text-[11px] text-gray-500"><Briefcase size={10} className="text-gray-400" /> {data.tags.profession}</span>
            <span className="flex items-center gap-1 text-[11px] text-gray-500"><Wallet size={10} className="text-gray-400" /> {data.tags.income}</span>
          </div>
        </div>
      </div>

      {/* Match Circle */}
      <div className="flex items-center gap-6 shrink-0">
        <MatchCircle pct={data.matchPercentage} />

        {/* Key Matches */}
        <div className="hidden lg:block w-[180px]">
          <p className="text-[11px] font-semibold text-gray-900 mb-2">Key Matches</p>
          <div className="flex flex-wrap gap-1.5">
            {data.keyMatches.map((m, i) => (
              <span key={i} className="text-[10px] font-medium bg-[#e8efea] text-brand-green px-2 py-0.5 rounded-md">
                {m.name} {m.percentage}%
              </span>
            ))}
            {data.extraMatchesCount > 0 && (
              <span className="text-[10px] text-brand-green font-medium mt-0.5">+{data.extraMatchesCount} more</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="h-8 px-3 bg-brand-green text-white text-[11px] font-semibold rounded-lg hover:bg-[#043d2e] transition-colors flex items-center gap-1.5 shadow-sm">
            View Details <ArrowRight size={12} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MatchingPage() {
  const [selectedClientId, setSelectedClientId] = useState("1");
  const [activeTab, setActiveTab] = useState("potential");
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set(["m1", "m4"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");

  const selectedClient = mockClients.find(c => c.id === selectedClientId)!;

  const toggleMatch = (id: string) => {
    const next = new Set(selectedMatches);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedMatches(next);
  };

  const tabs = ["Potential Matches", "Match Details", "Matching History"];
  const tabIds = ["potential", "details", "history"];

  return (
    <div className="bg-transparent h-[calc(100vh-24px)] w-full flex flex-col overflow-hidden relative z-10">
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top Header Section (Full Width) ── */}
        <div className="shrink-0 flex-col flex">
          <div className="mx-4 lg:mx-8 mt-4 lg:mt-6 mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[32px] md:text-[36px] font-serif text-brand-green leading-none tracking-tight">Matching</h1>
              <p className="text-gray-500 text-sm mt-1.5">Find the best matches for your clients using our smart matching system.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button className="h-9 px-4 border border-gray-200 bg-white rounded-xl text-[12px] font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors">
                <Clock size={14} /> Matching History
              </button>
            </div>
          </div>

          <div className="mx-4 lg:mx-8 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:flex-wrap items-start lg:items-center gap-4 lg:gap-x-10 lg:gap-y-6 w-full">
              
              {/* Search Box */}
              <div className="flex flex-col gap-1 w-full lg:w-64 group">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.08em]">Search Client</span>
                <div className="flex items-center border-b border-gray-200 focus-within:border-brand-green/50 pb-1.5 transition-colors duration-300 w-full">
                  <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search by name, phone or CNIC..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="bg-transparent focus:outline-none text-gray-900 text-[13px] w-full placeholder:text-gray-300 placeholder:font-light" 
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.08em]">Client Status</span>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pb-1">
                  {['All', 'Active', 'Pending'].map((statusOption) => (
                    <button key={statusOption} onClick={() => setActiveStatus(statusOption)} className="flex items-center gap-2 group select-none text-left focus:outline-none">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${activeStatus === statusOption ? 'border-brand-green border-[4px] bg-white' : 'border-gray-300 bg-transparent group-hover:border-brand-green/50'}`}></div>
                      <span className={`text-[13px] transition-colors duration-300 ${activeStatus === statusOption ? 'text-gray-900 font-medium' : 'text-gray-400 group-hover:text-gray-600'}`}>{statusOption}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="w-full mt-6 mb-0 border-b border-gray-200 shrink-0"></div>

        {/* ── Main Split Section ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-visible lg:overflow-hidden h-full">

          {/* Left: Client List */}
          <div className="w-full lg:w-1/3 xl:w-[25%] flex-col overflow-visible lg:overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300/50 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/80 [&::-webkit-scrollbar-thumb]:rounded-full flex h-full">
            <div className="mx-4 lg:mx-8 mt-4 mb-8 flex flex-col gap-1">
              {mockClients
                .filter(c => (activeStatus === "All" || c.status === activeStatus) && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((client) => {
                  const isSelected = client.id === selectedClientId;
                  return (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-[#f3f9f6]" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${isSelected ? "bg-brand-green text-white" : "bg-brand-green/10 text-brand-green"}`}>
                          {getInitials(client.name)}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className={`text-[13px] font-semibold truncate ${isSelected ? "text-brand-green" : "text-gray-900"}`}>{client.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{client.age} yrs • {client.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${client.status === "Active" ? "bg-[#e8efea] text-brand-green" : "bg-orange-50 text-orange-500"}`}>
                          {client.status}
                        </span>
                        <ChevronRight size={14} className={isSelected ? "text-brand-green" : "text-gray-300"} />
                      </div>
                    </div>
                  );
                })}
              
              {mockClients.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-8">No clients found.</div>
              )}
            </div>
          </div>

          <div className="hidden lg:block w-[1px] bg-gray-200 shrink-0 h-full"></div>

          {/* Right: Matches Panel */}
          <div className="flex-1 flex flex-col overflow-visible lg:overflow-y-auto relative scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300/50 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/80 [&::-webkit-scrollbar-thumb]:rounded-full h-full">
            <div className="mx-6 lg:mx-10 mt-6 lg:mt-6 mb-8 flex flex-col min-h-full">
              
              {/* Selected client header */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-sm shrink-0">
                    {getInitials(selectedClient.name)}
                  </div>
                  <div>
                    <h2 className="text-[16px] lg:text-[18px] font-bold text-gray-900">{selectedClient.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] text-gray-500">{selectedClient.age} years • {selectedClient.city}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${selectedClient.status === "Active" ? "bg-[#e8efea] text-brand-green" : "bg-orange-50 text-orange-500"}`}>
                        {selectedClient.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                    <div className="w-5 h-5 rounded bg-[#e8efea] flex items-center justify-center">
                      <span className="text-brand-green font-bold text-[11px]">10</span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700">Matches</span>
                  </div>
                  <button className="h-8 px-3 border border-gray-200 bg-white rounded-lg text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 shadow-sm hover:bg-gray-50 transition-colors">
                    <Eye size={13} /> Sort by: Match %
                  </button>
                  <button className="w-8 h-8 border border-gray-200 bg-white rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 shrink-0 mb-5">
                {tabs.map((tab, i) => {
                  const id = tabIds[i];
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`px-4 py-3 text-[12px] font-semibold transition-all relative ${isActive ? "text-brand-green" : "text-gray-500 hover:text-gray-800"}`}
                    >
                      {tab}
                      {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green rounded-t-full" />}
                    </button>
                  );
                })}
              </div>

              {/* Info banner */}
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2 text-[12px] text-gray-600">
                  <Sparkles size={14} className="text-brand-green shrink-0" />
                  We found <strong>10 potential matches</strong> for this client based on mutual preferences.
                </div>
                {selectedMatches.size > 0 && (
                  <button className="h-8 px-4 bg-brand-green text-white text-[11px] font-semibold rounded-lg hover:bg-[#043d2e] transition-colors flex items-center gap-1.5 shadow-sm">
                    <Send size={12} /> Request Selected ({selectedMatches.size})
                  </button>
                )}
              </div>

              {/* Match list */}
              <div className="flex-1 pb-10">
                {mockMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    data={match}
                    selected={selectedMatches.has(match.id)}
                    onSelect={() => toggleMatch(match.id)}
                  />
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
