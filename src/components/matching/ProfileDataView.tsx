import React from 'react';

export default function ProfileDataView({ data, prefs, isSource = false }: { data?: any, prefs?: any, isSource?: boolean }) {
  if (!data && !prefs) return null;

  const renderSection = (title: string, obj: any) => {
    if (!obj) return null;
    return (
      <div className="mb-4">
        <h4 className="text-xs font-bold text-[#16382E] uppercase tracking-wider mb-2 border-b border-[#EFE9DF] pb-1">{title}</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-[13px]">
          {Object.entries(obj).map(([key, value]) => {
            if (key === 'id' || key === 'profile_id' || key === 'preference_set_id' || key === 'created_at' || key === 'updated_at' || key === 'created_by') return null;
            if (value === null || value === undefined || value === '') return null;
            
            let displayValue = String(value);
            if (typeof value === 'object' && !Array.isArray(value)) displayValue = JSON.stringify(value);
            if (Array.isArray(value)) displayValue = value.join(', ');
            
            return (
              <div key={key}>
                <span className="text-[#888174] text-[11px] uppercase block mb-0.5">{key.replace(/_/g, ' ')}</span>
                <span className="text-[#16382E] font-medium truncate block" title={displayValue}>{displayValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`p-5 rounded-2xl border ${isSource ? 'bg-[#F2EDE4] border-[#D4C8B5]' : 'bg-[#FAF8F5] border-[#EFE9DF]'} mt-4`}>
      <h3 className="text-sm font-extrabold text-[#16382E] mb-4">{isSource ? 'Source Profile Details' : 'Candidate Details'}</h3>
      
      {data && (
        <div className="mb-6">
          <h4 className="text-[13px] font-bold text-[#115E49] mb-3">ACTUAL INFO</h4>
          <div className="space-y-1">
            {renderSection('Personal Info', Array.isArray(data.personal_information) ? data.personal_information[0] : data.personal_information)}
            {renderSection('Physical Info', Array.isArray(data.physical_information) ? data.physical_information[0] : data.physical_information)}
            {renderSection('Education', Array.isArray(data.education_records) ? data.education_records[0] : data.education_records)}
            {renderSection('Employment', Array.isArray(data.employment_records) ? data.employment_records[0] : data.employment_records)}
            {renderSection('Income', Array.isArray(data.income_information) ? data.income_information[0] : data.income_information)}
            {renderSection('Religion', Array.isArray(data.religion_information) ? data.religion_information[0] : data.religion_information)}
            {renderSection('Location', Array.isArray(data.profile_locations) ? data.profile_locations[0] : data.profile_locations)}
            {renderSection('Residency', Array.isArray(data.residency_information) ? data.residency_information[0] : data.residency_information)}
            {renderSection('Lifestyle', Array.isArray(data.lifestyle_information) ? data.lifestyle_information[0] : data.lifestyle_information)}
          </div>
        </div>
      )}

      {prefs && (
        <div>
          <h4 className="text-[13px] font-bold text-[#D4AF37] mb-3">WHAT THEY WANT (PREFERENCES)</h4>
          <div className="space-y-1">
            {renderSection('Basic Req', prefs.basic)}
            {renderSection('Physical Req', prefs.physical)}
            {renderSection('Education Req', prefs.education)}
            {renderSection('Profession Req', prefs.profession)}
            {renderSection('Religion Req', prefs.religion)}
            {renderSection('Location Req', prefs.location)}
            {renderSection('Family Req', prefs.family)}
            {renderSection('Lifestyle Req', prefs.lifestyle)}
            {renderSection('Relocation Req', prefs.relocation)}
          </div>
        </div>
      )}
    </div>
  );
}
