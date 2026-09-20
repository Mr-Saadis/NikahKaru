import { MapPin, Home, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LocationResidencyStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8EFEA] flex items-center justify-center text-brand-green">
            <MapPin size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Location & Residency</h2>
            <p className="text-sm text-gray-500 mt-0.5">Current location and living arrangements.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400">5 / 8</span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="w-5/8 h-full bg-brand-green rounded-full" style={{ width: '62.5%' }} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Location Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            <MapPin size={16} /> Location Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Country <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pakistan">Pakistan</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Province / State <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="punjab">Punjab</SelectItem>
                  <SelectItem value="sindh">Sindh</SelectItem>
                  <SelectItem value="kpk">KPK</SelectItem>
                  <SelectItem value="balochistan">Balochistan</SelectItem>
                  <SelectItem value="islamabad">Islamabad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                City <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. Lahore"
                className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Nationality / Citizenship <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. Pakistani"
                className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
              />
            </div>

          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Residency Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            <Home size={16} /> Residency & Living Arrangement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                House Status <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="own">Own</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="family">Family House</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Property Type <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Family Setup <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select setup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joint">Joint</SelectItem>
                  <SelectItem value="separate">Separate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Currently Living With <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select arrangement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="siblings">Siblings</SelectItem>
                  <SelectItem value="alone">Alone</SelectItem>
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
