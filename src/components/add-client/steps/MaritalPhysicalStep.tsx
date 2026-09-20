import { useState } from "react";
import { Heart, Activity, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MaritalPhysicalStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const [maritalStatus, setMaritalStatus] = useState("Never Married");
  const [hasDisability, setHasDisability] = useState("No");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8EFEA] flex items-center justify-center text-brand-green">
            <Heart size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Marital & Physical</h2>
            <p className="text-sm text-gray-500 mt-0.5">Details about marital history and physical attributes.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400">2 / 8</span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="w-2/8 h-full bg-brand-green rounded-full" style={{ width: '25%' }} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Marital Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            <Heart size={16} /> Marital Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Current Status <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {["Never Married", "Married", "Divorced", "Widowed", "Separated"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setMaritalStatus(status)}
                    className={`h-10 px-4 rounded-xl text-sm font-medium transition-all border ${
                      maritalStatus === status
                        ? "bg-brand-green border-brand-green text-white shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-brand-green/30 hover:bg-gray-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Fields based on Marital Status */}
            {maritalStatus !== "Never Married" && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#F8FAF9] border border-brand-green/10 mt-2">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                    Number of Children
                  </label>
                  <input type="number" min="0" placeholder="e.g. 2" className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white transition-all" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                    Children Living With You?
                  </label>
                  <Select>
                    <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="sometimes">Sometimes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {maritalStatus === "Divorced" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                      Reason for Divorce (Optional)
                    </label>
                    <textarea 
                      placeholder="Briefly explain..."
                      className="w-full h-24 p-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white resize-none transition-all"
                    />
                  </div>
                )}
                
                {maritalStatus === "Widowed" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                      Duration of Previous Marriage
                    </label>
                    <input type="text" placeholder="e.g. 5 years" className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white transition-all" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Physical Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            <Activity size={16} /> Physical Attributes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Height <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <input type="number" placeholder="Feet" className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
                <input type="number" placeholder="Inches" className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Weight (Kg)
              </label>
              <input type="number" placeholder="e.g. 70" className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Complexion / Rangat <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-gray-200 rounded-xl focus:ring-brand-green/20 focus:border-brand-green bg-white">
                  <SelectValue placeholder="Select complexion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="wheatish">Wheatish</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Disability
              </label>
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button 
                  onClick={() => setHasDisability("No")}
                  className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${hasDisability === "No" ? "bg-brand-green text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  No
                </button>
                <button 
                  onClick={() => setHasDisability("Yes")}
                  className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${hasDisability === "Yes" ? "bg-brand-green text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  Yes
                </button>
              </div>
            </div>

            {hasDisability === "Yes" && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                  Disability Details <span className="text-red-500">*</span>
                </label>
                <textarea 
                  placeholder="Please provide details..."
                  className="w-full h-24 p-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all resize-none"
                />
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
