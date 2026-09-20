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
    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 shrink-0">
      {["Doesn't Matter", "Preferred", "Must Have"].map((level) => (
        <button
          key={level}
          onClick={() => handleLevel(fieldKey, level)}
          className={`px-3 sm:px-4 py-1.5 h-9 rounded-md text-[11px] font-medium transition-all ${
            prefLevel[fieldKey] === level
              ? level === "Must Have" ? "bg-red-50 text-red-600 border border-red-100 shadow-sm" 
                : level === "Preferred" ? "bg-brand-green text-white shadow-sm" 
                : "bg-white text-gray-700 shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-gray-900 bg-transparent border border-transparent"
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );

  const PreferenceRow = ({ title, fieldKey, children }: { title: string, fieldKey: string, children: React.ReactNode }) => (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-6 border-b border-gray-100 last:border-0">
      <div className="w-full lg:w-[20%] text-[13px] font-semibold text-gray-900">
        {title} <span className="text-red-500">*</span>
      </div>
      <div className="w-full lg:w-[45%]">
        {children}
      </div>
      <div className="w-full lg:w-[35%] flex lg:justify-end">
        <PrefToggle fieldKey={fieldKey} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8EFEA] flex items-center justify-center text-brand-green">
            <Search size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Partner Preferences</h2>
            <p className="text-sm text-gray-500 mt-0.5">What kind of partner is the client looking for?</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400">8 / 9</span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="w-8/9 h-full bg-brand-green rounded-full" style={{ width: '88.8%' }} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-500 mb-2">Set the requirements and their priority level for the matching algorithm.</p>
        
        <div>
          
          <PreferenceRow title="Age Range" fieldKey="age">
            <div className="flex gap-3 items-center">
              <input type="number" placeholder="Min (e.g. 24)" className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all" />
              <span className="text-gray-400 font-medium">to</span>
              <input type="number" placeholder="Max (e.g. 29)" className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all" />
            </div>
          </PreferenceRow>

          <PreferenceRow title="Height Range" fieldKey="height">
            <div className="flex gap-3 items-center">
              <div className="flex-1 flex gap-2">
                <input type="number" placeholder="Ft" className="w-full h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all" />
                <input type="number" placeholder="In" className="w-full h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all" />
              </div>
              <span className="text-gray-400 font-medium">to</span>
              <div className="flex-1 flex gap-2">
                <input type="number" placeholder="Ft" className="w-full h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all" />
                <input type="number" placeholder="In" className="w-full h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all" />
              </div>
            </div>
          </PreferenceRow>

          <PreferenceRow title="Marital Status" fieldKey="marital">
            <Select>
              <SelectTrigger className="w-full h-11 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
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
              <SelectTrigger className="w-full h-11 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
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
            <input type="text" placeholder="e.g. Lahore, Pakistan or Dubai" className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all" />
          </PreferenceRow>

        </div>

        <div className="space-y-2 mt-6">
          <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
            Any Other Preferences (Optional)
          </label>
          <textarea 
            placeholder="Cast requirements, family setup preferences, etc."
            className="w-full h-24 p-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white resize-none transition-all"
          />
        </div>

      </div>

      {/* Action Bar */}
      <div className="pt-8 mt-8 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={onBack}
          className="h-11 px-6 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          className="h-11 px-6 rounded-xl bg-brand-green text-white text-sm font-semibold hover:bg-[#043d2e] transition-colors flex items-center gap-2 shadow-sm shadow-brand-green/20"
        >
          Save & Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
