import { User, Calendar, Phone, CreditCard, Lock, ArrowRight, Camera } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

interface BasicInfoStepProps {
  onNext: () => void;
  onCancel: () => void;
  profileImage: string | null;
  setProfileImage: (url: string | null) => void;
  onProgressChange?: (progress: number) => void;
}

export function BasicInfoStep({ onNext, onCancel, profileImage, setProfileImage, onProgressChange }: BasicInfoStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");

  // Progress Calculation
  useEffect(() => {
    let completedFields = 0;
    const totalFields = 5;
    
    if (name.trim().length > 0) completedFields++;
    if (gender !== "") completedFields++;
    if (dob.length === 10) completedFields++;
    if (phone.trim().length > 0) completedFields++;
    if (cnic.trim().length > 0) completedFields++;

    const progress = Math.round((completedFields / totalFields) * 100);
    onProgressChange?.(progress);
  }, [name, gender, dob, phone, cnic, onProgressChange]);

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.substring(0, 8);
    
    // Auto-format DD/MM/YYYY
    let formatted = val;
    if (val.length > 4) {
      formatted = `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4)}`;
    } else if (val.length > 2) {
      formatted = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setDob(formatted);

    // Auto-calculate Age
    if (val.length === 8) {
      const day = parseInt(val.substring(0, 2));
      const month = parseInt(val.substring(2, 4));
      const year = parseInt(val.substring(4, 8));
      
      const birthDate = new Date(year, month - 1, day);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        setAge(calculatedAge.toString());
      } else {
        setAge("");
      }
    } else {
      setAge("");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9E4DC] pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full bg-[#E5EFE9] flex items-center justify-center text-[#064e3b] group relative overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-[#064e3b] transition-all"
            title="Upload Profile Picture"
          >
            {profileImage ? (
              <Image src={profileImage} alt="Profile" fill className="object-cover" />
            ) : (
              <User size={28} />
            )}
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-[#002b17]">Basic Information</h2>
            <p className="text-sm text-[#7C756B] mt-0.5">Start with the client's fundamental details.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#888174]">1 / 8</span>
          <div className="w-24 h-1.5 bg-[#EFE9DF] rounded-full overflow-hidden">
            <div className="w-1/8 h-full bg-[#064e3b] rounded-full" style={{ width: '12.5%' }} />
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        
        {/* Full Name */}
        <div className="space-y-2">
          <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all"
          />
        </div>

        {/* Gender Toggle */}
        <div className="space-y-2">
          <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex bg-[#FBF9F5] p-1 rounded-2xl border border-[#E9E4DC]">
            <button 
              onClick={() => setGender("Male")}
              className={`flex-1 h-10 rounded-xl text-[13px] font-bold transition-all ${gender === "Male" ? "bg-[#064e3b] text-white" : "text-[#7C756B] hover:text-[#002b17] bg-transparent shadow-none"}`}
            >
              Male
            </button>
            <button 
              onClick={() => setGender("Female")}
              className={`flex-1 h-10 rounded-xl text-[13px] font-bold transition-all ${gender === "Female" ? "bg-[#064e3b] text-white" : "text-[#7C756B] hover:text-[#002b17] bg-transparent shadow-none"}`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888174]">
              <Calendar size={18} />
            </div>
            <input 
              type="text" 
              placeholder="DD/MM/YYYY"
              value={dob}
              onChange={handleDobChange}
              className="w-full h-12 pl-10 pr-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all"
            />
          </div>
        </div>

        {/* Age (Calculated) */}
        <div className="space-y-2">
          <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
            Age
          </label>
          <input 
            type="text" 
            disabled
            value={age ? `${age} years old` : ""}
            placeholder="Calculated automatically"
            className="w-full h-12 px-4 text-sm bg-[#FBF9F5] border border-[#E9E4DC] rounded-2xl text-[#002b17] cursor-not-allowed font-medium"
          />
        </div>

        {/* Contact Number */}
        <div className="space-y-2">
          <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888174]">
              <Phone size={18} />
            </div>
            <input 
              type="text" 
              placeholder="+92 3XX XXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-12 pl-10 pr-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all"
            />
          </div>
        </div>

        {/* CNIC */}
        <div className="space-y-2">
          <label className="text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1">
            CNIC <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888174]">
              <CreditCard size={18} />
            </div>
            <input 
              type="text" 
              placeholder="XXXXX-XXXXXXX-X"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              className="w-full h-12 pl-10 pr-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all"
            />
          </div>
          <p className="text-[11px] text-[#7C756B] flex items-center gap-1.5 mt-1.5">
            <Lock size={10} className="text-[#888174]" />
            Sensitive information. Will not be shared with other parties.
          </p>
        </div>

      </div>

      {/* Action Bar */}
      <div className="pt-8 mt-8 border-t border-[#E9E4DC] flex items-center justify-between">
        <button 
          onClick={onCancel}
          className="h-11 px-6 rounded-full border border-[#E9E4DC] bg-white text-[13px] font-bold text-[#4E473D] hover:bg-[#FBF9F5] shadow-sm transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={onNext}
          className="h-11 px-6 rounded-full bg-[#064e3b] text-white text-[13px] font-bold hover:bg-[#0f4229] transition-all flex items-center gap-2 shadow-sm"
        >
          Save & Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
