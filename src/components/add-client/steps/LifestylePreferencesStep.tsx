import { useState } from "react";
import { Coffee, Globe, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LifestylePreferencesStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const [relocate, setRelocate] = useState("No");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8EFEA] flex items-center justify-center text-brand-green">
            <Coffee size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Lifestyle</h2>
            <p className="text-sm text-gray-500 mt-0.5">Habits, religious practices, and relocation preferences.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400">7 / 9</span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="w-7/9 h-full bg-brand-green rounded-full" style={{ width: '77.7%' }} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Lifestyle Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            <Coffee size={16} /> Habits & Practices
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Religious Practice <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highly-practicing">Highly Practicing</SelectItem>
                  <SelectItem value="practicing">Practicing</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Smoking <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Beard
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="n/a">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Hijab
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="n/a">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Other Lifestyle Information
              </label>
              <textarea 
                placeholder="Any other relevant lifestyle habits..."
                className="w-full h-24 p-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all resize-none"
              />
            </div>

          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Relocation Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            <Globe size={16} /> Relocation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Willing to Relocate? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {["No", "Yes", "Depends"].map((opt) => (
                  <button 
                    key={opt}
                    onClick={() => setRelocate(opt)}
                    className={`h-10 px-6 rounded-xl text-sm font-medium transition-all border ${relocate === opt ? "bg-brand-green border-brand-green text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {(relocate === "Yes" || relocate === "Depends") && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-[#F8FAF9] border border-brand-green/10">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[13px] font-semibold text-gray-900">Preferred Countries / Cities</label>
                  <input type="text" placeholder="e.g. UK, Canada, Dubai..." className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
                </div>
                {relocate === "Depends" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[13px] font-semibold text-gray-900">Relocation Conditions</label>
                    <textarea 
                      placeholder="e.g. Depends on job transfer, or after 2 years..."
                      className="w-full h-20 p-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all resize-none"
                    />
                  </div>
                )}
              </div>
            )}

          </div>
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
