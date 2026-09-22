import { useState } from "react";
import { Heart, Activity, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MaritalPhysicalStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const [maritalStatus, setMaritalStatus] = useState("Never Married");
  const [hasDisability, setHasDisability] = useState("No");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9E4DC] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5EFE9] flex items-center justify-center text-[#064e3b]">
            <Heart size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#002b17]">Marital & Physical</h2>
            <p className="text-sm text-[#7C756B] mt-0.5">Details about marital history and physical attributes.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#888174]">2 / 8</span>
          <div className="w-24 h-1.5 bg-[#EFE9DF] rounded-full overflow-hidden">
            <div className="w-2/8 h-full bg-[#064e3b] rounded-full" style={{ width: '25%' }} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Marital Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-[#064e3b] mb-4 flex items-center gap-2">
            <Heart size={16} /> Marital Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Current Status <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {["Never Married", "Married", "Divorced", "Widowed", "Separated"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setMaritalStatus(status)}
                    className={`h-10 px-4 rounded-2xl text-sm font-medium transition-all border ${
                      maritalStatus === status
                        ? "bg-[#064e3b] border-[#064e3b] text-white shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]"
                        : "bg-white border-[#E9E4DC] text-[#4E473D] hover:border-[#064e3b]/30 hover:bg-[#FBF9F5]"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Fields based on Marital Status */}
            {maritalStatus !== "Never Married" && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#FBF9F5] border border-[#064e3b]/10 mt-2">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                    Number of Children
                  </label>
                  <input type="number" min="0" placeholder="e.g. 2" className="w-full h-12 px-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] bg-white transition-all" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                    Children Living With You?
                  </label>
                  <Select>
                    <SelectTrigger className="w-full h-12 px-4 text-sm border-[#E9E4DC] rounded-2xl focus:ring-[#064e3b]/20 focus:border-[#064e3b] bg-white">
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
                    <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                      Reason for Divorce (Optional)
                    </label>
                    <textarea 
                      placeholder="Briefly explain..."
                      className="w-full h-24 p-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] bg-white resize-none transition-all"
                    />
                  </div>
                )}
                
                {maritalStatus === "Widowed" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                      Duration of Previous Marriage
                    </label>
                    <input type="text" placeholder="e.g. 5 years" className="w-full h-12 px-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] bg-white transition-all" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-[#EFE9DF] w-full" />

        {/* Physical Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-[#064e3b] mb-4 flex items-center gap-2">
            <Activity size={16} /> Physical Attributes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Height <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <input type="number" placeholder="Feet" className="w-full h-12 px-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" />
                <input type="number" placeholder="Inches" className="w-full h-12 px-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Weight (Kg)
              </label>
              <input type="number" placeholder="e.g. 70" className="w-full h-12 px-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Complexion / Rangat <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-[#E9E4DC] rounded-2xl focus:ring-[#064e3b]/20 focus:border-[#064e3b] bg-white">
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
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Disability
              </label>
              <div className="flex bg-[#FBF9F5] p-1 rounded-2xl border border-[#E9E4DC]">
                <button 
                  onClick={() => setHasDisability("No")}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${hasDisability === "No" ? "bg-[#064e3b] text-white shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]" : "text-[#7C756B] hover:text-[#002b17]"}`}
                >
                  No
                </button>
                <button 
                  onClick={() => setHasDisability("Yes")}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${hasDisability === "Yes" ? "bg-[#064e3b] text-white shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]" : "text-[#7C756B] hover:text-[#002b17]"}`}
                >
                  Yes
                </button>
              </div>
            </div>

            {hasDisability === "Yes" && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                  Disability Details <span className="text-red-500">*</span>
                </label>
                <textarea 
                  placeholder="Please provide details..."
                  className="w-full h-24 p-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all resize-none"
                />
              </div>
            )}
          </div>
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
