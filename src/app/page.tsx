"use client";


import {
  Users,
  Link as LinkIcon,
  Bell,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Moon,
  PlusCircle
} from "lucide-react";

export default function Dashboard() {
  return (
    <>
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[300px] bg-gradient-to-bl from-brand-sand/10 to-transparent pointer-events-none rounded-bl-full" />

      <div className="p-8 xl:p-10 w-full max-w-[1600px] space-y-6 relative z-10">
          {/* Header Area */}
          <div className="flex justify-between items-start mb-8 relative">
            <div>
              <p className="text-gray-500 mb-2 flex items-center gap-2 text-sm font-medium">
                Good Morning, Ali ☕
              </p>
              <h1 className="text-[32px] md:text-[40px] font-serif text-brand-green mb-3 leading-[1.1] tracking-tight">
                Here's what's happening<br />with your clients today.
              </h1>
              <p className="text-gray-500 text-sm">Stay on top of your profiles, matches and pending requests.</p>
            </div>

            <div className="flex flex-col items-end gap-6">
              <div className="italic text-brand-slate/60 font-serif text-right text-lg hidden md:block">
                "The best things<br />in life are halal."
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                <Clock size={14} className="text-brand-slate" />
                <div className="flex flex-col items-end">
                  <span className="text-gray-700">20 Sep 2025</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Saturday</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Column: Stats & Recent Clients */}
            <div className="xl:col-span-8 space-y-6">

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Users className="text-brand-green" size={20} />} title="Total Clients" value="48" trend="+ 6%" trendUp />
                <StatCard icon={<LinkIcon className="text-brand-green" size={20} />} title="Active Matches" value="22" trend="+ 12%" trendUp />
                <StatCard icon={<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23064e3b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'%3E%3C/path%3E%3Cpolyline points='14 2 14 8 20 8'%3E%3C/polyline%3E%3Cline x1='16' y1='13' x2='8' y2='13'%3E%3C/line%3E%3Cline x1='16' y1='17' x2='8' y2='17'%3E%3C/line%3E%3Cpolyline points='10 9 9 9 8 9'%3E%3C/polyline%3E%3C/svg%3E" alt="doc" className="w-5 h-5" />} title="Pending Requests" value="7" trend="↓ 30%" trendUp={false} trendColor="text-brand-sand bg-brand-sand/10" />
                <StatCard icon={<Bell className="text-brand-green" size={20} />} title="New Notifications" value="3" trend="+ 50%" trendUp />
              </div>

              {/* Recent Clients */}
              <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[17px] font-semibold text-gray-900">Recent Clients</h2>
                  <button className="text-[13px] font-medium text-brand-slate flex items-center gap-1 hover:text-brand-green transition-colors">
                    View All <ChevronRight size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100 text-left text-[13px] font-medium">
                        <th className="pb-3 w-5/12 font-medium">Name</th>
                        <th className="pb-3 w-2/12 font-medium">Age</th>
                        <th className="pb-3 w-3/12 font-medium">Location</th>
                        <th className="pb-3 w-2/12 font-medium">Status</th>
                        <th className="pb-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <ClientRow name="Muhammad Ahmed ♂" age="29" location="Lahore" status="Active" meta="29 years • Lahore" img="11" />
                      <ClientRow name="Ayesha Khan ♀" age="27" location="Islamabad" status="Active" meta="27 years • Islamabad" img="44" />
                      <ClientRow name="Usman Tariq ♂" age="33" location="Karachi" status="Pending" meta="33 years • Karachi" img="33" />
                      <ClientRow name="Sara Raza ♀" age="31" location="Lahore" status="Active" meta="31 years • Lahore" img="45" />
                      <ClientRow name="Hamza Ali ♂" age="26" location="Faisalabad" status="Active" meta="26 years • Faisalabad" img="55" />
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Banner */}
              <div className="bg-gradient-to-r from-[#E5EEE8] to-[#F2EFE1] rounded-[20px] p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-center border border-[#DEE9E1]">
                <div className="relative z-10 w-full md:w-auto">
                  <p className="text-[10px] text-brand-slate/60 uppercase tracking-widest mb-3 font-semibold">Building Better Tomorrows</p>
                  <h2 className="text-[26px] font-serif text-brand-green mb-5 leading-[1.2]">More compatible matches.<br />Stronger families.</h2>
                  <div className="w-12 h-1 bg-[#D1C696] rounded-full"></div>
                </div>
                <div className="relative z-10 italic text-brand-slate font-serif md:text-right leading-relaxed max-w-[200px] mt-6 md:mt-0 opacity-80 text-[15px]">
                  "Halal rishtay,<br />behtar mustaqbil."
                </div>
                {/* Decorative leaves */}
                <div className="absolute -bottom-16 right-10 opacity-60 text-brand-green w-48 h-48 pointer-events-none">
                  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M165.733 118.846C153.256 94.7578 126.31 79.914 97.4716 79.914C68.6334 79.914 41.6876 94.7578 29.2104 118.846C20.5759 135.513 18.2323 155.679 22.8466 174.526C27.461 193.372 38.6475 209.308 54.4216 219.014C70.1956 228.72 89.2604 231.332 107.575 226.241C125.889 221.151 141.979 208.824 152.053 191.733C174.027 154.437 174.027 127.87 165.733 118.846Z" fill="url(#paint0_linear)" />
                    <path d="M192.518 80.6409C172.505 60.1064 142.062 55.459 117.513 69.176C92.9645 82.8931 77.2917 111.458 79.3787 139.697C80.8219 159.231 90.7259 176.924 106.671 188.423C122.616 199.922 143.14 204.148 162.779 199.98C182.418 195.811 199.421 183.626 209.431 166.082C219.442 148.539 221.579 127.24 215.353 107.838C201.764 65.5132 195.992 73.0487 192.518 80.6409Z" fill="url(#paint1_linear)" />
                    <defs>
                      <linearGradient id="paint0_linear" x1="97.4716" y1="79.914" x2="97.4716" y2="229.479" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#064e3b" stopOpacity="0.8" />
                        <stop offset="1" stopColor="#064e3b" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="paint1_linear" x1="148.563" y1="61.428" x2="148.563" y2="201.275" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#7F9489" stopOpacity="0.6" />
                        <stop offset="1" stopColor="#7F9489" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="xl:col-span-4 space-y-6">

              {/* Quick Actions */}
              <div className="bg-transparent pt-1">
                <h2 className="text-[17px] font-semibold text-gray-900 mb-1">Quick Actions</h2>
                <p className="text-[13px] text-gray-500 mb-4">Get started with the most common tasks.</p>
                <div className="grid grid-cols-2 gap-3">
                  <QuickAction icon={<PlusCircle size={18} className="text-brand-green" />} title="Add New Client" desc="Register a new profile" />
                  <QuickAction icon={<LinkIcon size={18} className="text-brand-green" />} title="Find Matches" desc="View matching results" />
                  <QuickAction icon={<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23064e3b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'%3E%3C/path%3E%3Cpolyline points='14 2 14 8 20 8'%3E%3C/polyline%3E%3Cline x1='16' y1='13' x2='8' y2='13'%3E%3C/line%3E%3Cline x1='16' y1='17' x2='8' y2='17'%3E%3C/line%3E%3Cpolyline points='10 9 9 9 8 9'%3E%3C/polyline%3E%3C/svg%3E" alt="doc" className="w-4 h-4" />} title="View Requests" desc="Check pending requests" />
                  <QuickAction icon={<Bell size={18} className="text-brand-green" />} title="View Notifications" desc="See latest updates" />
                </div>
              </div>

              {/* Matching Overview */}
              <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-[17px] font-semibold text-gray-900">Matching Overview</h2>
                  <button className="text-[13px] font-medium text-brand-slate flex items-center gap-1 hover:text-brand-green transition-colors">
                    View All <ChevronRight size={14} />
                  </button>
                </div>
                <p className="text-[13px] text-gray-500 mb-8">Potential matches found for your clients.</p>

                <div className="flex items-center gap-8 mb-10">
                  {/* Donut Chart */}
                  <div className="relative w-36 h-36 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      {/* Background */}
                      <path
                        className="text-gray-100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="4"
                      />
                      {/* Not Matched (7%) */}
                      <path
                        className="text-[#E2E8F0]"
                        strokeDasharray="7, 100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="4"
                      />
                      {/* One-way (15%) */}
                      <path
                        className="text-[#C3BA88]"
                        strokeDasharray="15, 100"
                        strokeDashoffset="-7"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="4"
                      />
                      {/* Two-way (78%) */}
                      <path
                        className="text-[#064e3b]"
                        strokeDasharray="78, 100"
                        strokeDashoffset="-22"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                      <span className="text-[26px] font-bold text-gray-900 leading-none mb-1">78%</span>
                      <span className="text-[10px] text-gray-500 text-center leading-tight">Overall Match<br />Rate</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-3.5 flex-1">
                    <LegendItem color="bg-[#064e3b]" label="Two-way Match" value="78%" />
                    <LegendItem color="bg-[#C3BA88]" label="One-way Match" value="15%" />
                    <LegendItem color="bg-[#E2E8F0]" label="Not Matched" value="7%" />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-[13px] font-semibold text-brand-green mb-4 uppercase tracking-wider">Top Matching Categories</h3>
                  <div className="space-y-4">
                    <ProgressItem icon={<Users size={16} />} label="Age Range" value={92} />
                    <ProgressItem icon={<GraduationCap size={16} />} label="Education" value={78} />
                    <ProgressItem icon={<MapPin size={16} />} label="Location" value={71} />
                    <ProgressItem icon={<Moon size={16} />} label="Religion" value={68} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-8">
            {/* Matching Requests */}
            <div className="xl:col-span-6 bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[17px] font-semibold text-gray-900">Matching Requests</h2>
                <button className="text-[13px] font-medium text-brand-slate flex items-center gap-1 hover:text-brand-green transition-colors">
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div className="space-y-2">
                <RequestRow name="Ali Khan" time="2h ago" agent="Agent Ali" status="Pending" img="61" />
                <RequestRow name="Ahmed Raza" time="4h ago" agent="Agent Sana" status="Under Review" img="62" />
                <RequestRow name="Usman Tariq" time="1d ago" agent="Agent Ali" status="Pending" img="33" />
                <RequestRow name="Hamza Ali" time="2d ago" agent="Agent Sana" status="Completed" img="55" />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="xl:col-span-6 bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[17px] font-semibold text-gray-900">Recent Activity</h2>
                <button className="text-[13px] font-medium text-brand-slate flex items-center gap-1 hover:text-brand-green transition-colors">
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div className="space-y-6 mt-2">
                <ActivityRow icon={<Users size={14} className="text-brand-green" />} title="New client added" desc="Ayesha Khan was added by Agent Ali" time="2h ago" bg="bg-[#E8EFEA]" />
                <ActivityRow icon={<LinkIcon size={14} className="text-brand-green" />} title="Matching request received" desc="For client Muhammad Ahmed" time="4h ago" bg="bg-[#E8EFEA]" />
                <ActivityRow icon={<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23C3BA88' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'%3E%3C/path%3E%3Cpath d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'%3E%3C/path%3E%3C/svg%3E" alt="edit" className="w-3.5 h-3.5" />} title="Profile updated" desc="Usman Tariq's profile was updated" time="Yesterday" bg="bg-[#F6F4EB]" />
                <ActivityRow icon={<CheckCircle2 size={14} className="text-brand-green" />} title="Response received" desc="Sara Raza marked as 'Interested'" time="Yesterday" bg="bg-[#E8EFEA]" />
              </div>
            </div>
          </div>

        </div>
    </>
  );
}


function StatCard({ icon, title, value, trend, trendUp, trendColor }: any) {
  return (
    <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col justify-between h-[140px]">
      <div className="w-10 h-10 rounded-[12px] bg-[#E8EFEA] flex items-center justify-center mb-auto">
        {icon}
      </div>
      <div className="mt-4">
        <p className="text-[13px] text-gray-500 mb-0.5">{title}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-[28px] font-semibold text-gray-900 leading-none">{value}</h3>
          <div className={`text-[11px] font-semibold px-2 py-1 rounded-[6px] ${trendColor || (trendUp ? "bg-[#E8EFEA] text-[#064e3b]" : "bg-red-50 text-red-600")
            }`}>
            {trend}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">vs. last 7 days</p>
    </div>
  );
}

function ClientRow({ name, age, location, status, meta, img }: any) {
  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
            <img src={`https://i.pravatar.cc/150?img=${img}`} alt={name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-[14px] leading-snug">{name}</p>
            <p className="text-[12px] text-gray-500">{meta}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 text-gray-600 text-[14px]">{age}</td>
      <td className="py-3.5 text-gray-600 text-[14px]">{location}</td>
      <td className="py-3.5">
        <span className={`text-[11px] px-3 py-1 rounded-full font-medium tracking-wide ${status === "Active" ? "bg-[#E8EFEA] text-[#064e3b]" : "bg-[#F6F4EB] text-brand-slate"
          }`}>
          {status}
        </span>
      </td>
      <td className="py-3.5 text-right">
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <ChevronRight size={16} />
        </button>
      </td>
    </tr>
  );
}

function QuickAction({ icon, title, desc }: any) {
  return (
    <button className="bg-white p-4 rounded-[16px] border border-gray-100 hover:border-brand-green/30 hover:shadow-sm transition-all text-left flex items-start gap-3.5 group">
      <div className="p-2.5 bg-[#E8EFEA] rounded-full group-hover:bg-[#dbe7de] transition-colors shrink-0">
        {icon}
      </div>
      <div className="pt-0.5">
        <h4 className="font-medium text-gray-900 text-[14px] group-hover:text-brand-green transition-colors flex items-center gap-1">
          {title} <ArrowUpRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all" />
        </h4>
        <p className="text-[12px] text-gray-500 mt-1 leading-snug">{desc}</p>
      </div>
    </button>
  );
}

function LegendItem({ color, label, value }: any) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <div className="flex items-center gap-2.5">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-gray-600">{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function ProgressItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[#a0aab8] bg-[#f8f9fa] p-1.5 rounded-full">{icon}</div>
      <div className="w-24 text-[13px] text-gray-600">{label}</div>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-green rounded-full" style={{ width: `${value}%` }}></div>
      </div>
      <div className="w-8 text-right text-[13px] font-semibold text-gray-900">{value}%</div>
    </div>
  );
}

function RequestRow({ name, time, agent, status, img }: any) {
  let statusColor = "";
  switch (status) {
    case "Pending": statusColor = "bg-[#F6F4EB] text-brand-slate"; break;
    case "Under Review": statusColor = "bg-[#F0FDF4] text-[#166534]"; break;
    case "Completed": statusColor = "bg-[#E8EFEA] text-[#064e3b]"; break;
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-2 -mx-2 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-[38px] h-[38px] rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
          <img src={`https://i.pravatar.cc/150?img=${img}`} alt={name} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-[14px] leading-snug">{name}</p>
          <p className="text-[12px] text-gray-500">Requested by: {agent} • {time}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[11px] px-3 py-1 rounded-full font-medium tracking-wide ${statusColor}`}>
          {status}
        </span>
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function ActivityRow({ icon, title, desc, time, bg }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div className="flex-1 pb-1 border-b border-gray-50 last:border-0">
        <div className="flex justify-between items-start">
          <p className="font-medium text-gray-900 text-[14px] leading-snug">{title}</p>
          <span className="text-[12px] text-gray-400 whitespace-nowrap ml-4">{time}</span>
        </div>
        <p className="text-[13px] text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
