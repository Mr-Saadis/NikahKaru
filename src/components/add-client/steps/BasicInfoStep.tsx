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
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full bg-[#E8EFEA] flex items-center justify-center text-brand-green group relative overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-brand-green transition-all"
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
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            <p className="text-sm text-gray-500 mt-0.5">Start with the client's fundamental details.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400">1 / 8</span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="w-1/8 h-full bg-brand-green rounded-full" style={{ width: '12.5%' }} />
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        
        {/* Full Name */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
          />
        </div>

        {/* Gender Toggle */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button 
              onClick={() => setGender("Male")}
              className={`flex-1 h-10 rounded-lg text-sm font-medium shadow-sm transition-all ${gender === "Male" ? "bg-brand-green text-white" : "text-gray-500 hover:text-gray-900 bg-transparent shadow-none"}`}
            >
              Male
            </button>
            <button 
              onClick={() => setGender("Female")}
              className={`flex-1 h-10 rounded-lg text-sm font-medium shadow-sm transition-all ${gender === "Female" ? "bg-brand-green text-white" : "text-gray-500 hover:text-gray-900 bg-transparent shadow-none"}`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Calendar size={18} />
            </div>
            <input 
              type="text" 
              placeholder="DD/MM/YYYY"
              value={dob}
              onChange={handleDobChange}
              className="w-full h-12 pl-10 pr-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
            />
          </div>
        </div>

        {/* Age (Calculated) */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
            Age
          </label>
          <input 
            type="text" 
            disabled
            value={age ? `${age} years old` : ""}
            placeholder="Calculated automatically"
            className="w-full h-12 px-4 text-sm bg-gray-50 border border-gray-100 rounded-xl text-gray-900 cursor-not-allowed font-medium"
          />
        </div>

        {/* Contact Number */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Phone size={18} />
            </div>
            <input 
              type="text" 
              placeholder="+92 3XX XXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-12 pl-10 pr-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
            />
          </div>
        </div>

        {/* CNIC */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-gray-900 flex gap-1">
            CNIC <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <CreditCard size={18} />
            </div>
            <input 
              type="text" 
              placeholder="XXXXX-XXXXXXX-X"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              className="w-full h-12 pl-10 pr-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
            />
          </div>
          <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-1.5">
            <Lock size={10} className="text-gray-400" />
            Sensitive information. Will not be shared with other parties.
          </p>
        </div>

      </div>

      {/* Action Bar */}
      <div className="pt-8 mt-8 border-t border-gray-100 flex items-center justify-between">
        <button 
          onClick={onCancel}
          className="h-11 px-6 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={onNext}
          className="h-11 px-6 rounded-xl bg-brand-green text-white text-sm font-semibold hover:bg-[#043d2e] transition-colors flex items-center gap-2 shadow-sm shadow-brand-green/20"
        >
          Save & Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
