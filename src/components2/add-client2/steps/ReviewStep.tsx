import { CheckCircle2, CheckCircle, ArrowLeft, User, Heart, Briefcase, Globe, MapPin, Users, Coffee, Search } from "lucide-react";
import Link from "next/link";

export function ReviewStep({ onBack }: { onBack: () => void }) {
  const ReviewSection = ({ title, icon: Icon, data }: { title: string, icon: any, data: { label: string, value: string }[] }) => (
    <div className="bg-white border border-[#E9E4DC] rounded-2xl p-6 shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
        <div className="w-8 h-8 rounded-full bg-[#E5EFE9] flex items-center justify-center text-[#064e3b]">
          <Icon size={16} />
        </div>
        <h3 className="font-semibold text-[#002b17]">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
        {data.map((item, i) => (
          <div key={i} className="space-y-1">
            <p className="text-[12px] text-[#7C756B] font-medium">{item.label}</p>
            <p className="text-[14px] text-[#002b17] font-medium">{item.value || "-"}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9E4DC] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5EFE9] flex items-center justify-center text-[#064e3b]">
            <CheckCircle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#002b17]">Review & Save</h2>
            <p className="text-sm text-[#7C756B] mt-0.5">Please review all information before saving the profile.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#888174]">9 / 9</span>
          <div className="w-24 h-1.5 bg-[#EFE9DF] rounded-full overflow-hidden">
            <div className="w-full h-full bg-[#064e3b] rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ReviewSection 
          title="Basic Information" 
          icon={User} 
          data={[
            { label: "Full Name", value: "Ali Ahmed" },
            { label: "Gender", value: "Male" },
            { label: "Date of Birth", value: "15/08/1995 (28 yrs)" },
            { label: "Client Phone", value: "+92 300 1234567" },
            { label: "Guardian Phone", value: "+92 300 7654321" },
            { label: "Profile Created By", value: "Self" },
          ]} 
        />
        
        <ReviewSection 
          title="Marital & Physical" 
          icon={Heart} 
          data={[
            { label: "Marital Status", value: "Never Married" },
            { label: "Height", value: "5 Ft 10 In" },
            { label: "Weight", value: "75 Kg" },
            { label: "Complexion", value: "Fair" },
            { label: "Physical Disability", value: "No" },
            { label: "Blood Group", value: "O+" },
          ]} 
        />

        <ReviewSection 
          title="Education & Profession" 
          icon={Briefcase} 
          data={[
            { label: "Highest Education", value: "Bachelors (BSCS)" },
            { label: "Institution", value: "NUST, Islamabad" },
            { label: "Profession", value: "Software Engineer" },
            { label: "Monthly Income", value: "Rs. 200,000" },
          ]} 
        />

        <ReviewSection 
          title="Religion & Culture" 
          icon={Globe} 
          data={[
            { label: "Religion", value: "Islam" },
            { label: "Sect", value: "Sunni" },
            { label: "Caste / Biradari", value: "Arain" },
            { label: "Mother Tongue", value: "Urdu" },
          ]} 
        />

        <ReviewSection 
          title="Location & Residency" 
          icon={MapPin} 
          data={[
            { label: "Nationality", value: "Pakistani" },
            { label: "Current City", value: "Lahore" },
            { label: "Current Country", value: "Pakistan" },
            { label: "Residential Status", value: "Citizen" },
          ]} 
        />

        <ReviewSection 
          title="Family Details" 
          icon={Users} 
          data={[
            { label: "Father's Status", value: "Alive" },
            { label: "Father's Profession", value: "Business" },
            { label: "Mother's Status", value: "Alive" },
            { label: "Brothers", value: "2 (1 Married)" },
            { label: "Sisters", value: "1 (Unmarried)" },
            { label: "Family System", value: "Nuclear" },
          ]} 
        />

        <ReviewSection 
          title="Lifestyle" 
          icon={Coffee} 
          data={[
            { label: "Religious Practice", value: "Practicing" },
            { label: "Smoking", value: "No" },
            { label: "Beard/Hijab", value: "Yes" },
            { label: "Willing to Relocate", value: "Depends" },
          ]} 
        />

        <ReviewSection 
          title="Partner Preferences" 
          icon={Search} 
          data={[
            { label: "Age Range", value: "24 to 28 (Must Have)" },
            { label: "Height Range", value: "5'2\" to 5'6\" (Preferred)" },
            { label: "Marital Status", value: "Never Married (Must Have)" },
            { label: "Education", value: "Bachelors (Preferred)" },
            { label: "Location", value: "Lahore, Pakistan (Doesn't Matter)" },
          ]} 
        />
      </div>

      {/* Action Bar */}
      <div className="pt-8 mt-8 border-t border-[#E9E4DC] flex items-center justify-between">
        <button 
          onClick={onBack}
          className="h-11 px-6 rounded-full border border-[#E9E4DC] bg-white text-[13px] font-bold text-[#4E473D] hover:bg-[#FBF9F5] shadow-sm transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Link 
          href="/overview2"
          className="h-11 px-8 rounded-2xl bg-[#064e3b] text-white text-sm font-semibold hover:bg-[#043d2e] transition-colors flex items-center gap-2 shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)] shadow-[#064e3b]/20"
        >
          <CheckCircle2 size={18} /> Finish & Save Profile
        </Link>
      </div>
    </div>
  );
}
