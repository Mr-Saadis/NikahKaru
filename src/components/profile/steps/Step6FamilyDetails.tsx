'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useReferenceData } from '@/lib/hooks/useReferenceData';
import type { ParentType, ParentStatus, SiblingGender, RelationshipStatus } from '@/lib/types/database.types';

type PartialParent = {
  _tempId: string;
  parent_type: ParentType;
  status: ParentStatus;
  full_name: string;
  age: number | '';
  profession: string;
  education: string;
};

type PartialSibling = {
  _tempId: string;
  gender: SiblingGender | '';
  full_name: string;
  age: number | '';
  marital_status: RelationshipStatus | '';
  profession: string;
};

type Step6Data = {
  parents: PartialParent[];
  siblings: PartialSibling[];
  family_profession_business: string;
  social_background: string;
  family_values: string;
  family_introduction: string;
};

interface Step6Props {
  data: Step6Data;
  onChange: (data: Step6Data) => void;
}

export type { Step6Data };

export default function Step6FamilyDetails({ data, onChange }: Step6Props) {
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
      age: '',
      profession: '',
      education: '',
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

  const inputClass = "w-full bg-[#FAF8F5] border border-[#EFE9DF] rounded-lg px-3 py-2 text-[12px] focus:border-[#064e3b] focus:outline-none placeholder:text-[#C4BDB5]";
  const textareaClass = "w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none transition-all resize-none";

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-[15px] font-bold text-[#1E1F22] mb-1">Family Details</h3>
        <p className="text-[12px] text-[#7D766C]">Parents, siblings, and family background.</p>
      </div>

      {/* Parents */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-[#232326]">Parents</h4>
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
          <div key={parent._tempId} className="p-4 rounded-xl border border-[#E9E4DC] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                parent.parent_type === 'FATHER' ? 'bg-[#E5EFE9] text-[#064e3b]' : 'bg-[#FCE7CE] text-[#8C5216]'
              }`}>
                {parent.parent_type}
              </span>
              <div className="flex items-center gap-2">
                {/* Status toggle */}
                <select
                  value={parent.status}
                  onChange={(e) => updateParent(idx, { status: e.target.value as ParentStatus })}
                  className="text-[11px] border border-[#E9E4DC] rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value="ALIVE">Alive</option>
                  <option value="DECEASED">Deceased</option>
                </select>
                <button type="button" onClick={() => set('parents', data.parents.filter((_, i) => i !== idx))}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-[#A8A296] hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Full Name</label>
                <input type="text" value={parent.full_name} onChange={(e) => updateParent(idx, { full_name: e.target.value })} placeholder="Name" className={inputClass} /></div>
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Age</label>
                <input type="number" value={parent.age} onChange={(e) => updateParent(idx, { age: e.target.value ? Number(e.target.value) : '' })} placeholder="Age" className={inputClass} /></div>
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Profession</label>
                <input type="text" value={parent.profession} onChange={(e) => updateParent(idx, { profession: e.target.value })} placeholder="e.g. Retired" className={inputClass} /></div>
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Education</label>
                <input type="text" value={parent.education} onChange={(e) => updateParent(idx, { education: e.target.value })} placeholder="e.g. Matric" className={inputClass} /></div>
            </div>
          </div>
        ))}
      </section>

      {/* Siblings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-[#232326]">Siblings</h4>
          <button type="button" onClick={() => set('siblings', [...data.siblings, { _tempId: crypto.randomUUID(), gender: '', full_name: '', age: '', marital_status: '', profession: '' }])}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#064e3b] hover:bg-[#F7FAF8] px-3 py-1.5 rounded-full border border-[#064e3b]/20 transition-colors">
            <Plus size={13} /> Add Sibling
          </button>
        </div>

        {data.siblings.length === 0 && (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#E9E4DC] text-center text-[12px] text-[#A8A296]">No siblings added.</div>
        )}

        {data.siblings.map((sib, idx) => (
          <div key={sib._tempId} className="p-4 rounded-xl border border-[#E9E4DC] bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#888174] uppercase tracking-wider">Sibling #{idx + 1}</span>
              <button type="button" onClick={() => set('siblings', data.siblings.filter((_, i) => i !== idx))}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-[#A8A296] hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Gender</label>
                <select value={sib.gender} onChange={(e) => updateSibling(idx, { gender: e.target.value as SiblingGender })} className={inputClass}>
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select></div>
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Name</label>
                <input type="text" value={sib.full_name} onChange={(e) => updateSibling(idx, { full_name: e.target.value })} placeholder="Name (opt.)" className={inputClass} /></div>
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Age</label>
                <input type="number" value={sib.age} onChange={(e) => updateSibling(idx, { age: e.target.value ? Number(e.target.value) : '' })} placeholder="Age" className={inputClass} /></div>
              <div><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Status</label>
                <select value={sib.marital_status} onChange={(e) => updateSibling(idx, { marital_status: e.target.value as RelationshipStatus })} className={inputClass}>
                  <option value="">Select</option>
                  {['MARRIED','UNMARRIED','DIVORCED','WIDOWED'].map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                </select></div>
              <div className="col-span-2"><label className="block text-[10px] uppercase font-bold tracking-wider text-[#888174] mb-1.5">Profession</label>
                <input type="text" value={sib.profession} onChange={(e) => updateSibling(idx, { profession: e.target.value })} placeholder="e.g. Doctor" className={inputClass} /></div>
            </div>
          </div>
        ))}
      </section>

      {/* Family Background */}
      <section className="space-y-4">
        <h4 className="text-[13px] font-bold text-[#232326]">Family Background</h4>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Family Profession / Business</label>
          <input type="text" value={data.family_profession_business} onChange={(e) => set('family_profession_business', e.target.value)} placeholder="e.g. Business family — textile" className="w-full bg-white border border-[#EFE9DF] rounded-xl px-4 py-3 text-[13px] placeholder:text-[#A8A296] focus:border-[#064e3b] focus:ring-1 focus:ring-[#064e3b]/20 focus:outline-none" />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Social Background</label>
          <textarea rows={2} value={data.social_background} onChange={(e) => set('social_background', e.target.value)} placeholder="Social class, reputation, community standing..." className={textareaClass} />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#676156]">Family Introduction</label>
          <textarea rows={3} value={data.family_introduction} onChange={(e) => set('family_introduction', e.target.value)} placeholder="Brief introduction of the family..." className={textareaClass} />
        </div>
      </section>
    </div>
  );
}
