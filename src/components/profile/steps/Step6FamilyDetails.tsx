'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';

import { Plus, Trash2 } from 'lucide-react';
import { useReferenceData } from '@/lib/hooks/useReferenceData';
import type { ParentType, ParentStatus, SiblingGender, RelationshipStatus } from '@/lib/types/database.types';

type PartialParent = {
  _tempId: string;
  parent_type: ParentType;
  status: ParentStatus;
  full_name: string;
  age?: string;
  profession: string;
  education?: string;
  country_id: number | '';
  city_id?: number | '';
  living_arrangement: string;
  social_background: string;
  additional_details: string;
};

type PartialSibling = {
  _tempId: string;
  gender: SiblingGender | '';
  full_name: string;
  age: string;
  marital_status: RelationshipStatus | '';
  profession: string;
  education: string;
  country_id: number | '';
  city_id?: number | '';
};

type Step6Data = {
  parents: PartialParent[];
  siblings: PartialSibling[];
  family_profession_business: string;
  social_background: string;
  family_values: string;
  family_introduction: string;
  important_family_circumstances: string;
  additional_details: string;
};

interface Step6Props {
  data: Step6Data;
  onChange: (data: Step6Data) => void;
}

export type { Step6Data };

export default function Step6FamilyDetails({ data, onChange }: Step6Props) {
  const { countries } = useReferenceData();

  const set = <K extends keyof Step6Data>(field: K, value: Step6Data[K]) =>
    onChange({ ...data, [field]: value });

  const hasFather = data.parents.some(p => p.parent_type === 'FATHER');
  const hasMother = data.parents.some(p => p.parent_type === 'MOTHER');

  const addParent = (type: ParentType) => {
    set('parents', [...data.parents, {
      _tempId: crypto.randomUUID(),
      parent_type: type,
      status: 'ALIVE',
      full_name: '',
      profession: '',
      country_id: '',
      living_arrangement: '',
      social_background: '',
      additional_details: '',
    }]);
  };

  const updateParent = (idx: number, patch: Partial<PartialParent>) => {
    const updated = [...data.parents];
    updated[idx] = { ...updated[idx], ...patch };
    set('parents', updated);
  };

  const updateSibling = (idx: number, patch: Partial<PartialSibling>) => {
    const updated = [...data.siblings];
    updated[idx] = { ...updated[idx], ...patch };
    set('siblings', updated);
  };

  const inputClass = "w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none";
  const textareaClass = "w-full min-h-[100px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none resize-y";

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Family Details</h3>
        <p className="text-[12px] text-[#7D766C]">Parents, siblings, and family background.</p>
      </div>

      {/* Parents */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-[#232326]">Parents <span className="text-red-500">*</span></h4>
          <div className="flex gap-2">
            {!hasFather && (
              <button type="button" onClick={() => addParent('FATHER')}
                className="flex items-center gap-1 text-[11px] font-bold text-[#064e3b] hover:bg-[#F7FAF8] px-3 py-1.5 rounded-full border border-[#064e3b]/20 transition-colors">
                <Plus size={12} /> Father
              </button>
            )}
            {!hasMother && (
              <button type="button" onClick={() => addParent('MOTHER')}
                className="flex items-center gap-1 text-[11px] font-bold text-[#064e3b] hover:bg-[#F7FAF8] px-3 py-1.5 rounded-full border border-[#064e3b]/20 transition-colors">
                <Plus size={12} /> Mother
              </button>
            )}
          </div>
        </div>

        {data.parents.map((parent, idx) => (
          <div key={parent._tempId || idx} className="p-4 rounded-xl border border-[#E9E4DC] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${parent.parent_type === 'FATHER' ? 'bg-[#E5EFE9] text-[#064e3b]' : 'bg-[#FCE7CE] text-[#8C5216]'
                }`}>
                {parent.parent_type}
              </span>
              <div className="flex items-center gap-2">
                {/* Status toggle */}
                <SearchableSelect
                  value={parent.status || ''}
                  onChange={(val) => updateParent(idx, { status: val as ParentStatus })}
                  options={[
                    { label: 'Alive', value: 'ALIVE' },
                    { label: 'Deceased', value: 'DECEASED' }
                  ]}
                  placeholder="Status"
                  className="bg-white border-[#E9E4DC] h-[30px] px-2 py-1 text-[11px] rounded-lg w-[120px]"
                />
                <button type="button" onClick={() => set('parents', data.parents.filter((_, i) => i !== idx))}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-[#A8A296] hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Full Name {parent.status !== 'DECEASED' && <span className="text-red-500">*</span>}</label>
                <input type="text" value={parent.full_name} onChange={(e) => {
                  if (/^[A-Za-z\s]*$/.test(e.target.value)) updateParent(idx, { full_name: e.target.value });
                }} placeholder="Name" className={inputClass} /></div>

              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Profession {parent.status !== 'DECEASED' && <span className="text-red-500">*</span>}</label>
                <input type="text" value={parent.profession} onChange={(e) => updateParent(idx, { profession: e.target.value })} placeholder="e.g. Retired" className={inputClass} /></div>

              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Country</label>
                <SearchableSelect
                  value={parent.country_id ? String(parent.country_id) : ''}
                  onChange={(val) => updateParent(idx, { country_id: val ? Number(val) : '' })}
                  options={countries.map(c => ({ label: c.name_en, value: String(c.id) }))}
                  placeholder="Select"
                  className=""
                /></div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Living Arrangement</label>
                <SearchableSelect
                  value={parent.living_arrangement || ''}
                  onChange={(val) => updateParent(idx, { living_arrangement: val })}
                  options={[
                    { label: 'Living with you', value: 'Living with you' },
                    { label: 'Living with others', value: 'Living with others' }
                  ]}
                  placeholder="Select Arrangement"
                  className=""
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">
                  Additional Details
                </label>
                <input type="text" value={parent.additional_details} onChange={(e) => updateParent(idx, { additional_details: e.target.value })} placeholder="Any other details..." className={inputClass} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Siblings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-[#232326]">Siblings</h4>
          <button type="button" onClick={() => set('siblings', [...data.siblings, { _tempId: crypto.randomUUID(), gender: '', full_name: '', age: '', marital_status: '', profession: '', education: '', country_id: '' }])}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#064e3b] hover:bg-[#F7FAF8] px-3 py-1.5 rounded-full border border-[#064e3b]/20 transition-colors">
            <Plus size={13} /> Add Sibling
          </button>
        </div>

        {data.siblings.length === 0 && (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#E9E4DC] text-center text-[12px] text-[#A8A296]">No siblings added.</div>
        )}

        {data.siblings.map((sib, idx) => (
          <div key={sib._tempId || idx} className="p-4 rounded-xl border border-[#E9E4DC] bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#888174] uppercase tracking-wider">Sibling #{idx + 1}</span>
              <button type="button" onClick={() => set('siblings', data.siblings.filter((_, i) => i !== idx))}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-[#A8A296] hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Gender</label>
                <SearchableSelect
                  value={sib.gender || ''}
                  onChange={(val) => updateSibling(idx, { gender: val as SiblingGender })}
                  options={[
                    { label: 'Male', value: 'MALE' },
                    { label: 'Female', value: 'FEMALE' }
                  ]}
                  placeholder="Select"
                  className=""
                /></div>
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Name</label>
                <input type="text" value={sib.full_name} onChange={(e) => {
                  if (/^[A-Za-z\s]*$/.test(e.target.value)) updateSibling(idx, { full_name: e.target.value });
                }} placeholder="Name (opt.)" className={inputClass} /></div>
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Age</label>
                <input type="text" value={sib.age} onChange={(e) => {
                  if (e.target.value === '' || /^\d+$/.test(e.target.value)) updateSibling(idx, { age: e.target.value });
                }} placeholder="Age" className={inputClass} /></div>

              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Status</label>
                <SearchableSelect
                  value={sib.marital_status || ''}
                  onChange={(val) => updateSibling(idx, { marital_status: val as RelationshipStatus })}
                  options={['MARRIED', 'UNMARRIED', 'DIVORCED', 'WIDOWED'].map(s => ({ label: s.charAt(0) + s.slice(1).toLowerCase(), value: s }))}
                  placeholder="Select"
                  className=""
                /></div>
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Profession</label>
                <input type="text" value={sib.profession} onChange={(e) => updateSibling(idx, { profession: e.target.value })} placeholder="e.g. Doctor" className={inputClass} /></div>
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Education</label>
                <input type="text" value={sib.education} onChange={(e) => updateSibling(idx, { education: e.target.value })} placeholder="e.g. B.Sc" className={inputClass} /></div>

              <div className="sm:col-span-2 md:col-span-3"><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Country</label>
                <SearchableSelect
                  value={sib.country_id ? String(sib.country_id) : ''}
                  onChange={(val) => updateSibling(idx, { country_id: val ? Number(val) : '' })}
                  options={countries.map(c => ({ label: c.name_en, value: String(c.id) }))}
                  placeholder="Select"
                  className=""
                /></div>
            </div>
          </div>
        ))}
      </section>

      {/* Family Background */}
      <section className="space-y-4">
        <h4 className="text-[13px] font-bold text-[#232326]">Family Background</h4>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Family Profession / Business</label>
          <input type="text" value={data.family_profession_business} onChange={(e) => set('family_profession_business', e.target.value)} placeholder="e.g. Business family — textile" className="w-full h-[52px] bg-[#FAF8F5] border border-[#8A968C] rounded-[20px] px-5 py-3.5 text-[14px] text-[#2F3E51] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all hover:border-[#064e3b]/50 shadow-none" />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Social Background</label>
          <textarea rows={2} value={data.social_background} onChange={(e) => set('social_background', e.target.value)} placeholder="Social class, reputation, community standing..." className={textareaClass} />
        </div>
      </section>
    </div>
  );
}
