import { useState } from "react";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PartnerPreferencesStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const [prefLevel, setPrefLevel] = useState<Record<string, string>>({
    age: "Preferred",
    height: "Preferred",
    marital: "Must Have",
    education: "Preferred",
    location: "Doesn't Matter"
  });

  const handleLevel = (key: string, level: string) => {
    setPrefLevel(prev => ({ ...prev, [key]: level }));
  };

  const PrefToggle = ({ fieldKey }: { fieldKey: string }) => (
    <div className="flex bg-[#FBF9F5] p-1 rounded-xl border border-[#E9E4DC] shrink-0">
      {["Doesn't Matter", "Preferred", "Must Have"].map((level) => (
        <button
          key={level}
          onClick={() => handleLevel(fieldKey, level)}
          className={`px-3 sm:px-4 py-1.5 h-9 rounded-md text-[11px] font-medium transition-all ${
            prefLevel[fieldKey] === level
              ? level === "Must Have" ? "bg-red-50 text-red-600 border border-red-100 shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]" 
                : level === "Preferred" ? "bg-[#064e3b] text-white shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]" 
                : "bg-white text-gray-700 shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] border border-[#E9E4DC]"
              : "text-[#7C756B] hover:text-[#002b17] bg-transparent border border-transparent"
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );

  const PreferenceRow = ({ title, fieldKey, children }: { title: string, fieldKey: string, children: React.ReactNode }) => (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 py-6 border-b border-[#E9E4DC] last:border-0">
      <div className="w-full xl:w-[22%] text-[13px] font-semibold text-[#002b17] shrink-0">
        {title} <span className="text-red-500">*</span>
      </div>
      <div className="w-full xl:flex-1 min-w-0">
        {children}
      </div>
      <div className="w-full xl:w-auto flex xl:justify-end shrink-0 mt-2 xl:mt-0">
        <PrefToggle fieldKey={fieldKey} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9E4DC] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5EFE9] flex items-center justify-center text-[#064e3b]">
            <Search size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#002b17]">Partner Preferences</h2>
            <p className="text-sm text-[#7C756B] mt-0.5">What kind of partner is the client looking for?</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#888174]">8 / 9</span>
          <div className="w-24 h-1.5 bg-[#EFE9DF] rounded-full overflow-hidden">
            <div className="w-8/9 h-full bg-[#064e3b] rounded-full" style={{ width: '88.8%' }} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-[#7C756B] mb-2">Set the requirements and their priority level for the matching algorithm.</p>
        
        <div>
          
          <PreferenceRow title="Age Range" fieldKey="age">
            <div className="flex gap-3 items-center">
              <input type="number" placeholder="Min (e.g. 24)" className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all" />
              <span className="text-[#888174] font-medium">to</span>
              <input type="number" placeholder="Max (e.g. 29)" className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all" />
            </div>
          </PreferenceRow>

          <PreferenceRow title="Height Range" fieldKey="height">
            <div className="flex gap-3 items-center">
              <div className="flex-1 flex gap-2">
                <input type="number" placeholder="Ft" className="w-full h-11 px-3 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all" />
                <input type="number" placeholder="In" className="w-full h-11 px-3 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all" />
              </div>
              <span className="text-[#888174] font-medium">to</span>
              <div className="flex-1 flex gap-2">
                <input type="number" placeholder="Ft" className="w-full h-11 px-3 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all" />
                <input type="number" placeholder="In" className="w-full h-11 px-3 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all" />
              </div>
            </div>
          </PreferenceRow>

          <PreferenceRow title="Marital Status" fieldKey="marital">
            <Select>
              <SelectTrigger className="w-full h-11 px-4 text-sm border-[#E9E4DC] rounded-2xl focus:ring-[#064e3b]/20 focus:border-[#064e3b] bg-white">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Doesn't Matter</SelectItem>
                <SelectItem value="never_married">Never Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </PreferenceRow>

          <PreferenceRow title="Education" fieldKey="education">
            <Select>
              <SelectTrigger className="w-full h-11 px-4 text-sm border-[#E9E4DC] rounded-2xl focus:ring-[#064e3b]/20 focus:border-[#064e3b] bg-white">
                <SelectValue placeholder="Minimum Education" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Doesn't Matter</SelectItem>
                <SelectItem value="bachelors">Bachelors</SelectItem>
                <SelectItem value="masters">Masters / MPhil</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
          </PreferenceRow>

          <PreferenceRow title="City / Country" fieldKey="location">
            <input type="text" placeholder="e.g. Lahore, Pakistan or Dubai" className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all" />
          </PreferenceRow>

        </div>

        <div className="space-y-2 mt-6">
          <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
            Any Other Preferences (Optional)
          </label>
          <textarea 
            placeholder="Cast requirements, family setup preferences, etc."
            className="w-full h-24 p-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] bg-white resize-none transition-all"
          />
        </div>

      </div>

      {/* Action Bar */}
      <div className="pt-8 mt-8 border-t border-[#E9E4DC] flex items-center justify-between">
        <button
          onClick={onBack}
          className="h-11 px-6 rounded-full border border-[#E9E4DC] bg-white text-[13px] font-bold text-[#4E473D] hover:bg-[#FBF9F5] shadow-sm transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          className="h-11 px-6 rounded-full bg-[#064e3b] text-white text-[13px] font-bold hover:bg-[#0f4229] transition-all flex items-center gap-2 shadow-sm"
        >
          Save & Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
