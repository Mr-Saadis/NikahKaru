import { Moon, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ReligionCultureStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8EFEA] flex items-center justify-center text-brand-green">
            <Moon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Religion & Culture</h2>
            <p className="text-sm text-gray-500 mt-0.5">Details regarding faith, sect, and cultural background.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400">4 / 8</span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="w-4/8 h-full bg-brand-green rounded-full" style={{ width: '50%' }} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            <Moon size={16} /> Religious Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Religion <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="islam">Islam</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Fiqah / Sect <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select sect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunni">Sunni</SelectItem>
                  <SelectItem value="shia">Shia</SelectItem>
                  <SelectItem value="ahl-e-hadith">Ahl-e-Hadith</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            Cultural Background
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Caste / Biradari <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. Rajput, Arain, Syed..."
                className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Mother Tongue <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urdu">Urdu</SelectItem>
                  <SelectItem value="punjabi">Punjabi</SelectItem>
                  <SelectItem value="sindhi">Sindhi</SelectItem>
                  <SelectItem value="pashto">Pashto</SelectItem>
                  <SelectItem value="balochi">Balochi</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
