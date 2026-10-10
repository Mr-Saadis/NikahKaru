import { useReferenceDataStore } from '@/lib/stores/reference-data-store';

export interface FormattedReleaseField {
  path: string;
  label: string;
  value: string;
}

export interface CandidateContext {
  gender?: string | null;
  marital_status?: string | null;
  full_name?: string | null;
}

const FIELD_LABEL_MAP: Record<string, string> = {
  full_name: 'Full Name',
  phone: 'Phone',
  primary_phone: 'Phone',
  date_of_birth: 'Date of Birth',
  marital_status: 'Marital Status',
  number_of_children: 'Children',
  children: 'Children',
  height_cm: 'Height (cm)',
  weight_kg: 'Weight (kg)',
  complexion: 'Complexion',
  has_disability: 'Disability',
  disability_details: 'Disability Details',
  qualification: 'Qualification',
  field_of_study: 'Field of Study',
  job_title: 'Job Title',
  monthly_income_min: 'Monthly Income',
  religion_id: 'Religion',
  sect_id: 'Sect',
  caste_id: 'Caste',
  mother_tongue_id: 'Mother Tongue',
  current_city_id: 'Current City',
  permanent_city_id: 'Permanent City',
  city_id: 'City',
  nationality_country_id: 'Nationality',
  country_id: 'Country',
  education_level_id: 'Education Level',
  occupation_id: 'Occupation',
  house_status: 'House Status',
  family_setup: 'Family Setup',
  family_profession_business: 'Family Profession',
  social_background: 'Social Background',
  living_with: 'Living With',
  religious_practice: 'Religious Practice',
  beard: 'Beard',
  hijab: 'Hijab',
  smoking: 'Smoking',
  education_records: 'Education',
  employment_records: 'Employment',
};

/**
 * Format field label from field path
 */
export function getFieldLabel(path: string): string {
  if (!path) return 'Field';
  const lastPart = path.split('.').pop() || path;
  if (FIELD_LABEL_MAP[lastPart]) {
    return FIELD_LABEL_MAP[lastPart];
  }
  return lastPart
    .replace(/_id$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Resolve reference data IDs into human-readable English names
 */
export function resolveFieldValue(path: string, rawVal: any): string {
  if (rawVal === null || rawVal === undefined || rawVal === '' || rawVal === 'N/A') {
    return 'N/A';
  }

  const lastPart = (path.split('.').pop() || path).toLowerCase();
  const refStore = useReferenceDataStore.getState();

  // 1. Reference Data ID resolutions
  if (typeof rawVal === 'number' || (typeof rawVal === 'string' && /^\d+$/.test(rawVal.trim()))) {
    const numId = Number(rawVal);

    if (lastPart === 'religion_id') {
      const item = refStore.getReligionById?.(numId) || refStore.religions?.find(r => r.id === numId);
      if (item?.name_en) return item.name_en;
    }
    if (lastPart === 'sect_id') {
      const item = refStore.getSectById?.(numId) || refStore.sects?.find(s => s.id === numId);
      if (item?.name_en) return item.name_en;
    }
    if (lastPart === 'caste_id') {
      const item = refStore.getCasteById?.(numId) || refStore.castes?.find(c => c.id === numId);
      if (item?.name_en) return item.name_en;
    }
    if (lastPart === 'mother_tongue_id') {
      const item = refStore.getMotherTongueById?.(numId) || refStore.motherTongues?.find(m => m.id === numId);
      if (item?.name_en) return item.name_en;
    }
    if (lastPart === 'current_city_id' || lastPart === 'permanent_city_id' || lastPart === 'city_id') {
      const item = refStore.getCityById?.(numId) || refStore.cities?.find(c => c.id === numId);
      if (item?.name_en) return item.name_en;
    }
    if (lastPart === 'nationality_country_id' || lastPart === 'country_id') {
      const item = refStore.getCountryById?.(numId) || refStore.countries?.find(c => c.id === numId);
      if (item?.name_en) return item.name_en;
    }
    if (lastPart === 'education_level_id') {
      const item = refStore.getEducationLevelById?.(numId) || refStore.educationLevels?.find(e => e.id === numId);
      if (item?.name_en) return item.name_en;
    }
    if (lastPart === 'occupation_id') {
      const item = refStore.getOccupationById?.(numId) || refStore.occupations?.find(o => o.id === numId);
      if (item?.name_en) return item.name_en;
    }
  }

  // 2. Boolean resolution
  if (typeof rawVal === 'boolean') {
    return rawVal ? 'Yes' : 'No';
  }

  // 3. Number resolution (e.g. income formatting)
  if (typeof rawVal === 'number') {
    if (lastPart.includes('income')) {
      return `PKR ${rawVal.toLocaleString()}`;
    }
    return String(rawVal);
  }

  // 4. String format resolution
  if (typeof rawVal === 'string') {
    const trimmed = rawVal.trim();
    if (trimmed === 'N/A' || !trimmed) return 'N/A';

    // Date strings (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      try {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      } catch {
        return trimmed;
      }
    }

    // Standard enum strings with UPPERCASE_UNDERSCORES -> Title Case
    if (/^[A-Z0-9_]+$/.test(trimmed)) {
      return trimmed
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    return trimmed;
  }

  // 5. Array records (Education & Employment)
  if (Array.isArray(rawVal)) {
    if (rawVal.length === 0) return 'None';

    if (lastPart.includes('education')) {
      return rawVal
        .map((item: any) => [item.qualification, item.institution_name].filter(Boolean).join(' - ') || 'Education Record')
        .join(', ');
    }

    if (lastPart.includes('employment')) {
      return rawVal
        .map((item: any) => [item.job_title, item.organization_name].filter(Boolean).join(' at ') || 'Employment Record')
        .join(', ');
    }

    return rawVal
      .map(item => typeof item === 'object' ? (item.name || item.title || item.qualification || 'Record') : String(item))
      .join(', ');
  }

  // 6. Object fallback
  if (typeof rawVal === 'object') {
    return Object.entries(rawVal)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
      .join(', ');
  }

  return String(rawVal);
}

/**
 * Filter irrelevant matrimonial fields:
 * - If NEVER_MARRIED: remove number_of_children
 * - If FEMALE: remove beard (and remove beard if N/A)
 * - If MALE: remove hijab (and remove hijab if N/A)
 * - If value is N/A for optional IDs (like city N/A): omit
 */
export function filterAndFormatReleaseFields(
  fields: Array<{ field_path: string; field_value: any }>,
  context?: CandidateContext
): FormattedReleaseField[] {
  if (!fields || !Array.isArray(fields)) return [];

  // Determine effective marital status (from context or from released fields)
  let maritalStatus = context?.marital_status?.toUpperCase() || '';
  if (!maritalStatus) {
    const maritalField = fields.find(f => f.field_path?.endsWith('marital_status'));
    if (maritalField?.field_value) {
      maritalStatus = String(maritalField.field_value).toUpperCase();
    }
  }

  // Determine effective gender
  let gender = context?.gender?.toUpperCase() || '';
  if (!gender) {
    // Infer from fields if available
    const hijabField = fields.find(f => f.field_path?.endsWith('hijab'));
    const beardField = fields.find(f => f.field_path?.endsWith('beard'));

    const hijabVal = String(hijabField?.field_value || '').toUpperCase();
    const beardVal = String(beardField?.field_value || '').toUpperCase();

    if ((hijabVal === 'YES' || hijabVal === 'NO') && (beardVal === 'N/A' || !beardVal)) {
      gender = 'FEMALE';
    } else if ((beardVal === 'YES' || beardVal === 'NO') && (hijabVal === 'N/A' || !hijabVal)) {
      gender = 'MALE';
    }
  }

  const result: FormattedReleaseField[] = [];

  for (const f of fields) {
    const path = f.field_path || '';
    const lastPart = (path.split('.').pop() || path).toLowerCase();
    const rawVal = f.field_value;
    const rawValStr = String(rawVal ?? '').trim().toUpperCase();

    // 1. Filter number_of_children if NEVER_MARRIED (or if 0 and never married)
    if (
      (lastPart === 'number_of_children' || lastPart === 'children') &&
      maritalStatus === 'NEVER_MARRIED'
    ) {
      continue;
    }

    // 2. Filter beard for Females OR if beard is N/A or empty
    if (lastPart === 'beard') {
      if (gender === 'FEMALE' || rawValStr === 'N/A' || rawValStr === '' || rawVal === null) {
        continue;
      }
    }

    // 3. Filter hijab for Males OR if hijab is N/A or empty
    if (lastPart === 'hijab') {
      if (gender === 'MALE' || rawValStr === 'N/A' || rawValStr === '' || rawVal === null) {
        continue;
      }
    }

    // 4. If current_city_id or permanent_city_id is N/A or null, omit to keep profile clean
    if (
      (lastPart === 'current_city_id' || lastPart === 'permanent_city_id') &&
      (rawValStr === 'N/A' || rawValStr === '' || rawVal === null)
    ) {
      continue;
    }

    const label = getFieldLabel(path);
    const value = resolveFieldValue(path, rawVal);

    result.push({
      path,
      label,
      value
    });
  }

  return result;
}
