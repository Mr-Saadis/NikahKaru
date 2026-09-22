import { useState } from "react";
import { Users, ArrowLeft, ArrowRight } from "lucide-react";

export function FamilyDetailsStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const [fatherStatus, setFatherStatus] = useState("Alive");
  const [motherStatus, setMotherStatus] = useState("Alive");
  const [hasSiblings, setHasSiblings] = useState("Yes");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9E4DC] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5EFE9] flex items-center justify-center text-[#064e3b]">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#002b17]">Family Details</h2>
            <p className="text-sm text-[#7C756B] mt-0.5">Information about parents, siblings, and family background.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#888174]">6 / 8</span>
          <div className="w-24 h-1.5 bg-[#EFE9DF] rounded-full overflow-hidden">
            <div className="w-6/8 h-full bg-[#064e3b] rounded-full" style={{ width: '75%' }} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Parents Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-[#064e3b] mb-4 flex items-center gap-2">
            Parents Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            {/* Father Status */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Father Status <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setFatherStatus("Alive")}
                  className={`h-10 px-6 rounded-2xl text-sm font-medium transition-all border ${fatherStatus === "Alive" ? "bg-[#064e3b] border-[#064e3b] text-white" : "bg-white border-[#E9E4DC] text-[#4E473D] hover:bg-[#FBF9F5]"}`}
                >
                  Alive
                </button>
                <button 
                  onClick={() => setFatherStatus("Deceased")}
                  className={`h-10 px-6 rounded-2xl text-sm font-medium transition-all border ${fatherStatus === "Deceased" ? "bg-[#064e3b] border-[#064e3b] text-white" : "bg-white border-[#E9E4DC] text-[#4E473D] hover:bg-[#FBF9F5]"}`}
                >
                  Deceased
                </button>
              </div>
            </div>

            {fatherStatus === "Alive" && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-[#FBF9F5] border border-[#E9E4DC]">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#002b17]">Father's Name</label>
                  <input type="text" className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#002b17]">Father's Profession</label>
                  <input type="text" className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" />
                </div>
              </div>
            )}

            {/* Mother Status */}
            <div className="space-y-2 md:col-span-2 mt-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Mother Status <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setMotherStatus("Alive")}
                  className={`h-10 px-6 rounded-2xl text-sm font-medium transition-all border ${motherStatus === "Alive" ? "bg-[#064e3b] border-[#064e3b] text-white" : "bg-white border-[#E9E4DC] text-[#4E473D] hover:bg-[#FBF9F5]"}`}
                >
                  Alive
                </button>
                <button 
                  onClick={() => setMotherStatus("Deceased")}
                  className={`h-10 px-6 rounded-2xl text-sm font-medium transition-all border ${motherStatus === "Deceased" ? "bg-[#064e3b] border-[#064e3b] text-white" : "bg-white border-[#E9E4DC] text-[#4E473D] hover:bg-[#FBF9F5]"}`}
                >
                  Deceased
                </button>
              </div>
            </div>

            {motherStatus === "Alive" && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-[#FBF9F5] border border-[#E9E4DC]">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#002b17]">Mother's Name</label>
                  <input type="text" className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#002b17]">Mother's Profession</label>
                  <input type="text" className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" />
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="h-px bg-[#EFE9DF] w-full" />

        {/* Siblings Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-[#064e3b] mb-4 flex items-center gap-2">
            Siblings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Do you have siblings? <span className="text-red-500">*</span>
              </label>
              <div className="flex bg-[#FBF9F5] p-1 rounded-2xl border border-[#E9E4DC]">
                <button 
                  onClick={() => setHasSiblings("Yes")}
                  className={`flex-1 h-9 rounded-xl text-sm font-medium transition-all ${hasSiblings === "Yes" ? "bg-[#064e3b] text-white shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]" : "text-[#7C756B] hover:text-[#002b17]"}`}
                >
                  Yes
                </button>
                <button 
                  onClick={() => setHasSiblings("No")}
                  className={`flex-1 h-9 rounded-xl text-sm font-medium transition-all ${hasSiblings === "No" ? "bg-[#064e3b] text-white shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]" : "text-[#7C756B] hover:text-[#002b17]"}`}
                >
                  No
                </button>
              </div>
            </div>

            {hasSiblings === "Yes" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#002b17]">Brothers</label>
                  <input type="number" placeholder="0" className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#002b17]">Sisters</label>
                  <input type="number" placeholder="0" className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-[#EFE9DF] w-full" />

        {/* Family Background */}
        <div>
          <h3 className="text-[15px] font-semibold text-[#064e3b] mb-4 flex items-center gap-2">
            Family Background
          </h3>
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
              Family Introduction & Background <span className="text-red-500">*</span>
            </label>
            <textarea 
              placeholder="Introduce your family, social background, values, etc..."
              className="w-full h-32 p-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all resize-none"
            />
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
