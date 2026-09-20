import { useState } from "react";
import { Users, ArrowLeft, ArrowRight } from "lucide-react";

export function FamilyDetailsStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const [fatherStatus, setFatherStatus] = useState("Alive");
  const [motherStatus, setMotherStatus] = useState("Alive");
  const [hasSiblings, setHasSiblings] = useState("Yes");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8EFEA] flex items-center justify-center text-brand-green">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Family Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">Information about parents, siblings, and family background.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400">6 / 8</span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="w-6/8 h-full bg-brand-green rounded-full" style={{ width: '75%' }} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Parents Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            Parents Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            {/* Father Status */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Father Status <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setFatherStatus("Alive")}
                  className={`h-10 px-6 rounded-xl text-sm font-medium transition-all border ${fatherStatus === "Alive" ? "bg-brand-green border-brand-green text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  Alive
                </button>
                <button 
                  onClick={() => setFatherStatus("Deceased")}
                  className={`h-10 px-6 rounded-xl text-sm font-medium transition-all border ${fatherStatus === "Deceased" ? "bg-brand-green border-brand-green text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  Deceased
                </button>
              </div>
            </div>

            {fatherStatus === "Alive" && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-900">Father's Name</label>
                  <input type="text" className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-900">Father's Profession</label>
                  <input type="text" className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
                </div>
              </div>
            )}

            {/* Mother Status */}
            <div className="space-y-2 md:col-span-2 mt-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Mother Status <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setMotherStatus("Alive")}
                  className={`h-10 px-6 rounded-xl text-sm font-medium transition-all border ${motherStatus === "Alive" ? "bg-brand-green border-brand-green text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  Alive
                </button>
                <button 
                  onClick={() => setMotherStatus("Deceased")}
                  className={`h-10 px-6 rounded-xl text-sm font-medium transition-all border ${motherStatus === "Deceased" ? "bg-brand-green border-brand-green text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  Deceased
                </button>
              </div>
            </div>

            {motherStatus === "Alive" && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-900">Mother's Name</label>
                  <input type="text" className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-900">Mother's Profession</label>
                  <input type="text" className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Siblings Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            Siblings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
                Do you have siblings? <span className="text-red-500">*</span>
              </label>
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button 
                  onClick={() => setHasSiblings("Yes")}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${hasSiblings === "Yes" ? "bg-brand-green text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  Yes
                </button>
                <button 
                  onClick={() => setHasSiblings("No")}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${hasSiblings === "No" ? "bg-brand-green text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  No
                </button>
              </div>
            </div>

            {hasSiblings === "Yes" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-900">Brothers</label>
                  <input type="number" placeholder="0" className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-900">Sisters</label>
                  <input type="number" placeholder="0" className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Family Background */}
        <div>
          <h3 className="text-[15px] font-semibold text-brand-green mb-4 flex items-center gap-2">
            Family Background
          </h3>
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
              Family Introduction & Background <span className="text-red-500">*</span>
            </label>
            <textarea 
              placeholder="Introduce your family, social background, values, etc..."
              className="w-full h-32 p-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all resize-none"
            />
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
