import { Search, Filter, ChevronRight, User } from "lucide-react";
import Image from "next/image";

interface Client {
  id: string;
  name: string;
  age: number;
  city: string;
  status: "Active" | "Pending";
  image: string;
}

const mockClients: Client[] = [
  { id: "1", name: "Muhammad Ahmed", age: 29, city: "Lahore", status: "Active", image: "" },
  { id: "2", name: "Ayesha Khan", age: 27, city: "Islamabad", status: "Active", image: "" },
  { id: "3", name: "Usman Tariq", age: 33, city: "Karachi", status: "Pending", image: "" },
  { id: "4", name: "Sara Raza", age: 31, city: "Lahore", status: "Active", image: "" },
  { id: "5", name: "Hamza Ali", age: 26, city: "Faisalabad", status: "Active", image: "" },
  { id: "6", name: "Zainab Fatima", age: 28, city: "Multan", status: "Active", image: "" },
  { id: "7", name: "Bilal Khan", age: 32, city: "Peshawar", status: "Pending", image: "" },
  { id: "8", name: "Fatima Noor", age: 30, city: "Rawalpindi", status: "Active", image: "" },
];

export function ClientSidebar({ selectedClientId = "1" }: { selectedClientId?: string }) {
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      
      {/* Search Header */}
      <div className="p-4 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search client by name, phone or CNIC..." 
            className="w-full h-10 pl-9 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 shadow-sm"
          />
        </div>
        <button className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shrink-0 shadow-sm">
          <Filter size={16} />
        </button>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
        {mockClients.map((client) => {
          const isSelected = client.id === selectedClientId;
          return (
            <div 
              key={client.id}
              className={`flex items-center gap-3 p-3 mb-2 cursor-pointer transition-colors rounded-2xl ${
                isSelected 
                  ? "bg-[#F3F9F6]" 
                  : "bg-transparent hover:bg-white/50"
              }`}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-brand-green/10 flex items-center justify-center text-brand-green text-[13px] font-bold">
                {client.image ? (
                  <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(client.name)
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-semibold text-gray-900 truncate">
                  {client.name}
                </h4>
                <p className="text-[11px] text-gray-500">
                  {client.age} years • {client.city}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                  client.status === "Active" 
                    ? "bg-[#E6F4EA] text-brand-green" 
                    : "bg-[#FEF0E6] text-orange-600"
                }`}>
                  {client.status}
                </span>
                <ChevronRight size={14} className={isSelected ? "text-brand-green" : "text-gray-300"} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="p-4">
        <div className="bg-white/60 rounded-xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-200">
            <User size={14} className="text-gray-400" />
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            <span className="font-semibold text-gray-700 block mb-1">Select a client to view their potential matches.</span>
            Matches are based on your client's preferences and our matching algorithm.
          </p>
        </div>
      </div>
      
    </div>
  );
}
