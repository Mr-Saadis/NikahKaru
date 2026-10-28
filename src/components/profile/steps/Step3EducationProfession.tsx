'use client';
import { SearchableSelect } from '@/components/ui/searchable-select';

import { Plus, Trash2 } from 'lucide-react';
import { useReferenceData } from '@/lib/hooks/useReferenceData';
import type { EducationRecord, EmploymentRecord, IncomeInformation, EmploymentType } from '@/lib/types/database.types';

type PartialEducation = Partial<Omit<EducationRecord, 'id' | 'profile_id' | 'created_at'>> & { _tempId: string };
type PartialEmployment = Partial<Omit<EmploymentRecord, 'id' | 'profile_id' | 'created_at'>> & { _tempId: string };

type Step3Data = {
  education_records: PartialEducation[];
  employment_records: PartialEmployment[];
  monthly_income_min: number | '';
  monthly_income_max: number | '';
};

interface Step3Props {
  data: Step3Data;
  onChange: (data: Step3Data) => void;
}

export type { Step3Data };

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'PRIVATE', label: 'Private' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'SELF_EMPLOYED', label: 'Self Employed' },
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'UNEMPLOYED', label: 'Unemployed' },
  { value: 'OTHER', label: 'Other' },
];

const newEdu = (): PartialEducation => ({
  _tempId: crypto.randomUUID(),
  education_level_id: undefined,
  field_of_study: '',
  details: '',
  is_highest_qualification: false,
});

const newEmp = (): PartialEmployment => ({
  _tempId: crypto.randomUUID(),
  occupation_id: undefined,
  job_title: '',
  employment_type: undefined,
  is_current: true,
  details: '',
});

export default function Step3EducationProfession({ data, onChange }: Step3Props) {
  const { educationLevels, occupations } = useReferenceData();

  const set = <K extends keyof Step3Data>(field: K, value: Step3Data[K]) =>
    onChange({ ...data, [field]: value });

  const updateEdu = (idx: number, patch: Partial<PartialEducation>) => {
    const updated = [...data.education_records];
    updated[idx] = { ...updated[idx], ...patch };
    set('education_records', updated);
  };

  const updateEmp = (idx: number, patch: Partial<PartialEmployment>) => {
    const updated = [...data.employment_records];
    updated[idx] = { ...updated[idx], ...patch };
    set('employment_records', updated);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Education & Profession</h3>
        <p className="text-[12px] text-[#7D766C]">Academic qualifications and employment details.</p>
      </div>

      {/* Education Records */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-[#232326]">Education</h4>
          <button
            type="button"
            onClick={() => set('education_records', [...data.education_records, newEdu()])}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#064e3b] hover:bg-[#F7FAF8] px-3 py-1.5 rounded-full border border-[#064e3b]/20 transition-colors"
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {data.education_records.length === 0 && (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#E9E4DC] text-center text-[12px] text-[#A8A296]">
            No education records added. Click "Add" to start.
          </div>
        )}

        {data.education_records.map((edu, idx) => (
          <div key={edu._tempId || idx} className="p-4 rounded-xl border border-[#E9E4DC] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#888174] uppercase tracking-wider">
                Record #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => set('education_records', data.education_records.filter((_, i) => i !== idx))}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-[#A8A296] hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Level <span className="text-red-500">*</span></label>
                <SearchableSelect
                  value={edu.education_level_id ? String(edu.education_level_id) : ''}
                  onChange={(val) => updateEdu(idx, { education_level_id: val ? Number(val) : undefined })}
                  options={educationLevels.map(l => ({ label: l.name_en, value: String(l.id) }))}
                  placeholder="Select level"
                  className=""
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Field of Study</label>
                <input
                  type="text"
                  value={edu.field_of_study ?? ''}
                  onChange={(e) => updateEdu(idx, { field_of_study: e.target.value })}
                  placeholder="e.g. Computer Science, Medicine, Commerce"
                  className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Additional Details</label>
                <input
                  type="text"
                  value={edu.details ?? ''}
                  onChange={(e) => updateEdu(idx, { details: e.target.value })}
                  placeholder="Grades, honors, or other info..."
                  className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={edu.is_highest_qualification ?? false}
                onChange={(e) => updateEdu(idx, { is_highest_qualification: e.target.checked })}
                className="accent-[#064e3b] w-3.5 h-3.5"
              />
              <span className="text-[11.5px] text-[#676156] font-medium">Highest qualification</span>
            </label>
          </div>
        ))}
      </section>

      {/* Employment Records */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-[#232326]">Employment</h4>
          <button
            type="button"
            onClick={() => set('employment_records', [...data.employment_records, newEmp()])}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#064e3b] hover:bg-[#F7FAF8] px-3 py-1.5 rounded-full border border-[#064e3b]/20 transition-colors"
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {data.employment_records.length === 0 && (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#E9E4DC] text-center text-[12px] text-[#A8A296]">
            No employment records added.
          </div>
        )}

        {data.employment_records.map((emp, idx) => (
          <div key={emp._tempId || idx} className="p-4 rounded-xl border border-[#E9E4DC] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#888174] uppercase tracking-wider">
                Job #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => set('employment_records', data.employment_records.filter((_, i) => i !== idx))}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-[#A8A296] hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Occupation <span className="text-red-500">*</span></label>
                <SearchableSelect
                  value={emp.occupation_id ? String(emp.occupation_id) : ''}
                  onChange={(val) => updateEmp(idx, { occupation_id: val ? Number(val) : undefined })}
                  options={occupations.map(o => ({ label: o.name_en, value: String(o.id) }))}
                  placeholder="Select occupation"
                  className=""
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Employment Type <span className="text-red-500">*</span></label>
                <SearchableSelect
                  value={emp.employment_type || ''}
                  onChange={(val) => updateEmp(idx, { employment_type: val as EmploymentType || undefined })}
                  options={EMPLOYMENT_TYPES.map(t => ({ label: t.label, value: t.value }))}
                  placeholder="Select type"
                  className=""
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Job Title</label>
                <input
                  type="text"
                  value={emp.job_title ?? ''}
                  onChange={(e) => updateEmp(idx, { job_title: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Additional Details</label>
                <input
                  type="text"
                  value={emp.details ?? ''}
                  onChange={(e) => updateEmp(idx, { details: e.target.value })}
                  placeholder="Key responsibilities, achievements..."
                  className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emp.is_current ?? true}
                onChange={(e) => updateEmp(idx, { is_current: e.target.checked })}
                className="accent-[#064e3b] w-3.5 h-3.5"
              />
              <span className="text-[11.5px] text-[#676156] font-medium">Currently employed here</span>
            </label>
          </div>
        ))}
      </section>

      {/* Income */}
      <section className="space-y-3">
        <h4 className="text-[13px] font-bold text-[#232326]">Monthly Income (PKR)</h4>
        <div className="grid grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Minimum</label>
            <input
              type="text"
              inputMode="numeric"
              value={data.monthly_income_min === '' ? '' : data.monthly_income_min}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                set('monthly_income_min', val ? Number(val) : '');
              }}
              placeholder="e.g. 50000"
              className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174]">Maximum</label>
            <input
              type="text"
              inputMode="numeric"
              value={data.monthly_income_max === '' ? '' : data.monthly_income_max}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                set('monthly_income_max', val ? Number(val) : '');
              }}
              placeholder="e.g. 100000"
              className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
