import { Check, MoreHorizontal, ArrowRight, Heart, Book, Briefcase, Wallet, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export interface MatchData {
  id: string;
  name: string;
  gender: "male" | "female";
  age: number;
  city: string;
  image: string;
  tags: {
    marital: string;
    education: string;
    profession: string;
    income: string;
  };
  matchPercentage: number;
  keyMatches: { name: string; percentage: number }[];
  extraMatchesCount: number;
  selected?: boolean;
}

export function MatchCard({ data, onSelect }: { data: MatchData, onSelect: () => void }) {
  
  // Calculate SVG circle properties for match percentage
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.matchPercentage / 100) * circumference;

  return (
    <div className={`p-4 rounded-[20px] border transition-all ${data.selected ? 'bg-[#F3F9F6] border-brand-green' : 'bg-white border-gray-200 hover:border-brand-green/30'}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        
        {/* Left Section: Checkbox & Profile */}
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={onSelect}
            className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${data.selected ? 'bg-brand-green border-brand-green' : 'border-gray-300 hover:border-brand-green'}`}
          >
            {data.selected && <Check size={12} className="text-white" />}
          </button>
          
          <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 bg-brand-green/10 flex items-center justify-center text-brand-green text-xl font-bold">
            {data.image ? (
              <img src={data.image} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              data.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-gray-900">{data.name}</h3>
              <span className="text-gray-400 text-xs">{data.gender === 'female' ? '♀' : '♂'}</span>
            </div>
            <p className="text-[12px] text-gray-500 mt-0.5">{data.age} years • {data.city}</p>
            
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
                <Heart size={12} className="text-gray-400" /> {data.tags.marital}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
                <Book size={12} className="text-gray-400" /> {data.tags.education}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
                <Briefcase size={12} className="text-gray-400" /> {data.tags.profession}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
                <Wallet size={12} className="text-gray-400" /> {data.tags.income}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Match Percentage */}
        <div className="flex items-center justify-center shrink-0 border-l border-r border-gray-100 px-8">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-gray-100"
                strokeWidth="6"
                fill="none"
                stroke="currentColor"
              />
              {/* Progress Circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-brand-green"
                strokeWidth="6"
                fill="none"
                stroke="currentColor"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-gray-900 leading-none">{data.matchPercentage}%</span>
              <span className="text-[10px] text-gray-500 font-medium mt-1">Match</span>
            </div>
          </div>
        </div>

        {/* Right Section: Key Matches & Actions */}
        <div className="flex items-center justify-between flex-1 gap-4">
          <div className="space-y-2">
            <h4 className="text-[12px] font-semibold text-gray-900">Key Matches</h4>
            <div className="flex flex-wrap items-center gap-2">
              {data.keyMatches.map((match, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-[#E6F4EA] px-2 py-1 rounded-md text-[10px] font-medium text-gray-700">
                  <span className="text-brand-green">{match.name}</span> {match.percentage}%
                </div>
              ))}
              {data.extraMatchesCount > 0 && (
                <span className="text-[10px] font-medium text-brand-green">+{data.extraMatchesCount} more</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button className="h-9 px-4 bg-brand-green text-white text-[12px] font-semibold rounded-lg hover:bg-[#043d2e] transition-colors flex items-center gap-1.5 shadow-sm">
              View Details <ArrowRight size={14} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
