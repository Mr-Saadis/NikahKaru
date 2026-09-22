import { BookOpen, Briefcase, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function EducationProfessionStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9E4DC] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5EFE9] flex items-center justify-center text-[#064e3b]">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#002b17]">Education & Profession</h2>
            <p className="text-sm text-[#7C756B] mt-0.5">Academic background and current occupation.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#888174]">3 / 8</span>
          <div className="w-24 h-1.5 bg-[#EFE9DF] rounded-full overflow-hidden">
            <div className="w-3/8 h-full bg-[#064e3b] rounded-full" style={{ width: '37.5%' }} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Education Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-[#064e3b] mb-4 flex items-center gap-2">
            <BookOpen size={16} /> Education
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Highest Qualification <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-[#E9E4DC] rounded-2xl focus:ring-[#064e3b]/20 focus:border-[#064e3b] bg-white">
                  <SelectValue placeholder="Select qualification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phd">Ph.D.</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                  <SelectItem value="intermediate">Intermediate / A-Levels</SelectItem>
                  <SelectItem value="matric">Matriculation / O-Levels</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Education Details <span className="text-red-500">*</span>
              </label>
              <textarea 
                placeholder="e.g. BS Computer Science from NUST, graduated in 2020..."
                className="w-full h-24 p-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all resize-none"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-[#EFE9DF] w-full" />

        {/* Profession Section */}
        <div>
          <h3 className="text-[15px] font-semibold text-[#064e3b] mb-4 flex items-center gap-2">
            <Briefcase size={16} /> Profession & Income
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Employment Type <span className="text-red-500">*</span>
              </label>
              <Select>
                <SelectTrigger className="w-full h-12 px-4 text-sm border-[#E9E4DC] rounded-2xl focus:ring-[#064e3b]/20 focus:border-[#064e3b] bg-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="business">Business / Entrepreneur</SelectItem>
                  <SelectItem value="self-employed">Self-employed</SelectItem>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Profession / Occupation <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. Software Engineer"
                className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
                Salary / Income Range <span className="text-[#888174] font-normal">(Optional)</span>
              </label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Min Income"
                  className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all"
                />
                <div className="flex items-center text-[#888174]">to</div>
                <input 
                  type="text" 
                  placeholder="Max Income"
                  className="w-full h-11 px-4 text-sm border border-[#E9E4DC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all"
                />
              </div>
            </div>

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
