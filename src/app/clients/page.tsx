"use client";

import { useState } from "react";
import { Search, ChevronRight, Edit, Mail, Phone, MapPin, Calendar, Heart, Book, Briefcase, Wallet, FileText, UserPlus, MoreHorizontal, User } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  age: number;
  city: string;
  status: "Active" | "Pending";
  phone: string;
  email: string;
  joinedDate: string;
  details: {
    marital: string;
    education: string;
    profession: string;
    income: string;
    religion: string;
    sect: string;
    cast: string;
    height: string;
    weight: string;
  };
  preferences: {
    ageRange: string;
    marital: string;
    education: string;
    profession: string;
    city: string;
  };
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockClients: Client[] = [
  { 
    id: "1", name: "Muhammad Ahmed", age: 29, city: "Lahore", status: "Active",
    phone: "+92 300 1234567", email: "ahmed@example.com", joinedDate: "12 Aug, 2023",
    details: { marital: "Never Married", education: "Masters in Computer Science", profession: "Software Engineer", income: "PKR 150k - 200k", religion: "Islam", sect: "Sunni", cast: "Rajput", height: "5' 10\"", weight: "75 kg" },
    preferences: { ageRange: "24 - 28", marital: "Never Married", education: "Bachelors / Masters", profession: "Doesn't Matter", city: "Lahore / Islamabad" }
  },
  { 
    id: "2", name: "Ayesha Khan", age: 27, city: "Islamabad", status: "Active",
    phone: "+92 333 7654321", email: "ayesha.k@example.com", joinedDate: "05 Sep, 2023",
    details: { marital: "Never Married", education: "MBBS", profession: "Doctor", income: "PKR 120k - 180k", religion: "Islam", sect: "Sunni", cast: "Pathan", height: "5' 4\"", weight: "55 kg" },
    preferences: { ageRange: "28 - 33", marital: "Never Married", education: "Masters or equivalent", profession: "Doctor / Engineer / Business", city: "Islamabad / Rawalpindi" }
  },
  { 
    id: "3", name: "Usman Tariq", age: 33, city: "Karachi", status: "Pending",
    phone: "+92 321 9876543", email: "usman.t@example.com", joinedDate: "20 Sep, 2023",
    details: { marital: "Divorced", education: "BBA", profession: "Business Owner", income: "PKR 300k+", religion: "Islam", sect: "Sunni", cast: "Arain", height: "5' 8\"", weight: "82 kg" },
    preferences: { ageRange: "25 - 32", marital: "Divorced / Widowed / Never Married", education: "Bachelors", profession: "Doesn't Matter", city: "Karachi" }
  },
  { 
    id: "4", name: "Sara Raza", age: 31, city: "Lahore", status: "Active",
    phone: "+92 300 1112223", email: "sara.raza@example.com", joinedDate: "01 Oct, 2023",
    details: { marital: "Never Married", education: "Bachelors in Design", profession: "UI/UX Designer", income: "PKR 100k - 150k", religion: "Islam", sect: "Shia", cast: "Syed", height: "5' 6\"", weight: "60 kg" },
    preferences: { ageRange: "31 - 36", marital: "Never Married", education: "Masters", profession: "Corporate Professional", city: "Lahore / Islamabad" }
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</span>
      <span className="text-[14px] text-gray-900 font-medium">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [selectedClientId, setSelectedClientId] = useState("1");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");

  const selectedClient = mockClients.find(c => c.id === selectedClientId) || mockClients[0];

  const tabs = ["Overview", "Partner Preferences", "Documents"];
  const tabIds = ["overview", "preferences", "documents"];

  return (
    <div className="bg-transparent h-[calc(100vh-24px)] w-full flex flex-col overflow-hidden relative z-10">
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top Header Section (Full Width) ── */}
        <div className="shrink-0 flex-col flex">
          <div className="mx-4 lg:mx-8 mt-4 lg:mt-6 mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[32px] md:text-[36px] font-serif text-brand-green leading-none tracking-tight">Clients</h1>
              <p className="text-gray-500 text-sm mt-1.5">Manage and view detailed profiles of your clients.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button className="h-9 px-4 bg-brand-green text-white rounded-xl text-[12px] font-semibold hover:bg-[#043d2e] flex items-center gap-2 shadow-sm transition-colors">
                <UserPlus size={14} /> Add New Client
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

          {/* Right: Client Detail Panel */}
          <div className="flex-1 flex flex-col overflow-visible lg:overflow-y-auto relative scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300/50 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/80 [&::-webkit-scrollbar-thumb]:rounded-full h-full">
            
            {selectedClient && (
              <div className="mx-6 lg:mx-10 mt-6 lg:mt-6 mb-8 flex flex-col min-h-full">
                
                {/* Selected client header */}
                <div className="flex items-start justify-between mb-6 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xl shrink-0">
                      {getInitials(selectedClient.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[22px] font-bold text-gray-900">{selectedClient.name}</h2>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${selectedClient.status === "Active" ? "bg-[#e8efea] text-brand-green" : "bg-orange-50 text-orange-500"}`}>
                          {selectedClient.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[13px] text-gray-500">
                        <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> {selectedClient.age} years</span>
                        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> {selectedClient.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="h-9 px-4 border border-brand-green/20 bg-brand-green/5 text-brand-green rounded-xl text-[12px] font-semibold flex items-center gap-2 hover:bg-brand-green/10 transition-colors">
                      View Matches
                    </button>
                    <button className="h-9 px-4 border border-gray-200 bg-white rounded-xl text-[12px] font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors">
                      <Edit size={14} /> Edit Profile
                    </button>
                    <button className="w-9 h-9 border border-gray-200 bg-white rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </div>

                {/* Quick Contact Info */}
                <div className="flex flex-wrap gap-4 mb-6 shrink-0 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div className="flex items-center gap-3 pr-6 border-r border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                      <Phone size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Phone Number</p>
                      <p className="text-[13px] font-semibold text-gray-900">{selectedClient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pr-6 border-r border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                      <Mail size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Email Address</p>
                      <p className="text-[13px] font-semibold text-gray-900">{selectedClient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                      <Calendar size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Joined Date</p>
                      <p className="text-[13px] font-semibold text-gray-900">{selectedClient.joinedDate}</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 shrink-0 mb-6">
                  {tabs.map((tab, i) => {
                    const id = tabIds[i];
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`px-4 py-3 text-[13px] font-semibold transition-all relative ${isActive ? "text-brand-green" : "text-gray-500 hover:text-gray-800"}`}
                      >
                        {tab}
                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green rounded-t-full" />}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <div className="flex-1 pb-10">
                  {activeTab === "overview" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      
                      {/* Section 1 */}
                      <div>
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <User size={16} className="text-brand-green" /> Personal Information
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                          <DetailRow label="Marital Status" value={selectedClient.details.marital} />
                          <DetailRow label="Religion" value={selectedClient.details.religion} />
                          <DetailRow label="Sect" value={selectedClient.details.sect} />
                          <DetailRow label="Cast" value={selectedClient.details.cast} />
                          <DetailRow label="Height" value={selectedClient.details.height} />
                          <DetailRow label="Weight" value={selectedClient.details.weight} />
                        </div>
                      </div>

                      {/* Section 2 */}
                      <div>
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Briefcase size={16} className="text-brand-green" /> Education & Career
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                          <DetailRow label="Education" value={selectedClient.details.education} />
                          <DetailRow label="Profession" value={selectedClient.details.profession} />
                          <DetailRow label="Income Range" value={selectedClient.details.income} />
                        </div>
                      </div>

                    </div>
                  )}

                  {activeTab === "preferences" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div>
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Heart size={16} className="text-brand-green" /> What they are looking for
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                          <DetailRow label="Age Range" value={selectedClient.preferences.ageRange} />
                          <DetailRow label="Marital Status" value={selectedClient.preferences.marital} />
                          <DetailRow label="Education" value={selectedClient.preferences.education} />
                          <DetailRow label="Profession" value={selectedClient.preferences.profession} />
                          <DetailRow label="City / Location" value={selectedClient.preferences.city} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "documents" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex flex-col items-center justify-center p-10 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-center">
                        <FileText size={32} className="text-gray-400 mb-3" />
                        <h3 className="text-[15px] font-semibold text-gray-800 mb-1">No documents uploaded yet</h3>
                        <p className="text-[13px] text-gray-500 max-w-md">Upload CNIC, photos, or other relevant documents for this client.</p>
                        <button className="mt-4 h-9 px-4 bg-white border border-gray-200 text-brand-green rounded-xl text-[12px] font-semibold shadow-sm hover:bg-gray-50 transition-colors">
                          Upload Document
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
