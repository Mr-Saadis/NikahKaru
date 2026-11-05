import { createClient } from '@/lib/supabase/client';
import type { 
  Profile, 
  PersonalInformation, 
  PhysicalInformation, 
  EducationRecord,
  EmploymentRecord,
  IncomeInformation,
  ReligionInformation,
  ProfileLocation,
  ResidencyInformation,
  Parent,
  Sibling,
  Child,
  PreviousMarriage,
  FamilyInformation,
  LifestyleInformation,
  RelocationInformation,
  ProfileStatus,
  ProfileListItem,
  ProfileGender
} from '@/lib/types/database.types';

export interface ProfileFilters {
  search?: string;
  gender?: ProfileGender;
  status?: ProfileStatus;
  cityId?: number;
  minAge?: number;
  maxAge?: number;
  page?: number;
  limit?: number;
}

export class ProfileService {
  /**
   * CREATE / INITIALIZE PROFILE
   */
  static async createProfile(userId: string, gender: string): Promise<Profile> {
    const supabase = createClient();
    
    // As per schema, a profile needs created_by, current_agent_id and gender
    // It defaults to DRAFT status and generates a short_id
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        created_by: userId,
        current_agent_id: userId,
        gender: gender,
        status: 'DRAFT',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as Profile;
  }

  /**
   * UPLOAD PROFILE PICTURE (with validation & sanitization)
   */
  static async uploadProfilePicture(profileId: string, file: File): Promise<string> {
    const supabase = createClient();

    // 1. Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Image size exceeds 5MB limit. Please upload a smaller image.');
    }

    // 2. Validate MIME type
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      throw new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.');
    }

    // 3. Validate and sanitize file extension
    const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExt = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : 'jpg';

    // 4. Generate collision-resistant secure filename
    const uniqueSuffix = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    const fileName = `${profileId}-${uniqueSuffix}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('Profile_Picture')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('Profile_Picture')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  static async updateProfileUrl(profileId: string, url: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ profile_URL: url })
      .eq('id', profileId);

    if (error) throw error;
  }

  /**
   * DELETE PROFILE PICTURE from storage bucket
   */
  static async deleteProfilePicture(publicUrl: string): Promise<void> {
    const supabase = createClient();
    try {
      // Extract file name from public URL (everything after the last slash)
      const url = new URL(publicUrl);
      const pathParts = url.pathname.split('/');
      let fileName = pathParts[pathParts.length - 1];
      
      // Remove any query params just in case
      fileName = fileName.split('?')[0];

      if (!fileName) return;
      
      const { error } = await supabase.storage
        .from('Profile_Picture')
        .remove([fileName]);
      
      if (error) {
        console.error('Failed to delete old profile picture:', error);
      }
    } catch (e) {
      console.error('Error parsing profile picture URL for deletion:', e);
    }
  }


  /**
   * STEP 1: Personal Information
   */
  static async savePersonalInfo(profileId: string, data: Partial<PersonalInformation>): Promise<PersonalInformation> {
    const supabase = createClient();
    
    // Check if exists
    const { data: existing } = await supabase.from('personal_information').select('profile_id').eq('profile_id', profileId).maybeSingle();
    
    const sanitized = {
      full_name: data.full_name,
      cnic: data.cnic || null,
      phone: data.phone || null,
      date_of_birth: data.date_of_birth || null,
      marital_status: data.marital_status || 'NEVER_MARRIED',
      number_of_children: data.number_of_children ? Number(data.number_of_children) : 0,
      nationality_country_id: data.nationality_country_id ? Number(data.nationality_country_id) : null,
      multiple_nationality: Boolean(data.multiple_nationality),
      mother_tongue_id: data.mother_tongue_id ? Number(data.mother_tongue_id) : null,
    };

    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('personal_information').update(sanitized).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('personal_information').insert({ ...sanitized, profile_id: profileId }).select().single();
      if (error) throw error;
      result = inserted;
    }
    return result as PersonalInformation;
  }

  /**
   * STEP 2: Physical Information
   */
  static async savePhysicalInfo(profileId: string, data: Partial<PhysicalInformation>): Promise<PhysicalInformation> {
    const supabase = createClient();
    const { data: existing } = await supabase.from('physical_information').select('profile_id').eq('profile_id', profileId).maybeSingle();

    const h = (data.height_cm != null && (data.height_cm as any) !== '') ? Number(data.height_cm) : null;
    const w = (data.weight_kg != null && (data.weight_kg as any) !== '') ? Number(data.weight_kg) : null;

    const sanitized: Partial<PhysicalInformation> = {
      ...data,
      height_cm: (h !== null && !isNaN(h) && h >= 80 && h <= 250) ? h : null,
      weight_kg: (w !== null && !isNaN(w) && w >= 20 && w <= 400) ? w : null,
      complexion: data.complexion || null,
      has_disability: Boolean(data.has_disability),
      disability_details: data.has_disability ? (data.disability_details || null) : null,
    };

    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('physical_information').update(sanitized).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('physical_information').insert({ ...sanitized, profile_id: profileId }).select().single();
      if (error) throw error;
      result = inserted;
    }
    return result as PhysicalInformation;
  }

  /**
   * STEP 3A: Education Records
   */
  static async saveEducationRecords(profileId: string, records: Partial<EducationRecord>[]): Promise<void> {
    const supabase = createClient();
    
    await supabase.from('education_records').delete().eq('profile_id', profileId);
    
    if (records.length > 0) {
      const sanitized = records.map(r => ({
        profile_id: profileId,
        education_level_id: r.education_level_id ? Number(r.education_level_id) : null,
        qualification: r.qualification || null,
        institution_name: r.institution_name || null,
        field_of_study: r.field_of_study || null,
        start_year: r.start_year ? Number(r.start_year) : null,
        end_year: r.end_year ? Number(r.end_year) : null,
        is_highest_qualification: Boolean(r.is_highest_qualification),
        details: r.details || null,
      }));
      const { error } = await supabase.from('education_records').insert(sanitized);
      if (error) throw error;
    }
  }

  /**
   * STEP 3B: Employment Records
   */
  static async saveEmploymentRecords(profileId: string, records: Partial<EmploymentRecord>[]): Promise<void> {
    const supabase = createClient();
    await supabase.from('employment_records').delete().eq('profile_id', profileId);
    if (records.length > 0) {
      const sanitized = records.map(r => ({
        profile_id: profileId,
        occupation_id: r.occupation_id ? Number(r.occupation_id) : null,
        job_title: r.job_title || null,
        organization_name: r.organization_name || null,
        employment_type: r.employment_type || null,
        start_date: r.start_date || null,
        end_date: r.is_current ? null : (r.end_date || null),
        is_current: Boolean(r.is_current),
        details: r.details || null,
      }));
      const { error } = await supabase.from('employment_records').insert(sanitized);
      if (error) throw error;
    }
  }

  /**
   * STEP 3C: Income Information
   */
  static async saveIncomeInfo(profileId: string, data: Partial<IncomeInformation>): Promise<IncomeInformation> {
    const supabase = createClient();
    const { data: existing } = await supabase.from('income_information').select('profile_id').eq('profile_id', profileId).maybeSingle();
    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('income_information').update(data).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('income_information').insert({ ...data, profile_id: profileId }).select().single();
      if (error) throw error;
      result = inserted;
    }
    return result as IncomeInformation;
  }

  /**
   * STEP 4: Religion & Culture
   */
  static async saveReligionInfo(profileId: string, data: Partial<ReligionInformation>): Promise<ReligionInformation> {
    const supabase = createClient();
    const { data: existing } = await supabase.from('religion_information').select('profile_id').eq('profile_id', profileId).maybeSingle();
    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('religion_information').update(data).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('religion_information').insert({ ...data, profile_id: profileId }).select().single();
      if (error) throw error;
      result = inserted;
    }
    return result as ReligionInformation;
  }

  /**
   * STEP 5A: Profile Locations
   */
  static async saveLocations(profileId: string, data: Partial<ProfileLocation>): Promise<ProfileLocation> {
    const supabase = createClient();
    const { data: existing } = await supabase.from('profile_locations').select('profile_id').eq('profile_id', profileId).maybeSingle();
    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('profile_locations').update(data).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('profile_locations').insert({ ...data, profile_id: profileId }).select().single();
      if (error) throw error;
      result = inserted;
    }
    return result as ProfileLocation;
  }

  /**
   * STEP 5B: Residency Information
   */
  static async saveResidencyInfo(profileId: string, data: Partial<ResidencyInformation>): Promise<ResidencyInformation> {
    const supabase = createClient();
    const { data: existing } = await supabase.from('residency_information').select('profile_id').eq('profile_id', profileId).maybeSingle();
    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('residency_information').update(data).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('residency_information').insert({ ...data, profile_id: profileId }).select().single();
      if (error) throw error;
      result = inserted;
    }
    return result as ResidencyInformation;
  }

  /**
   * STEP 6A: Parents
   */
  static async saveParents(profileId: string, records: Partial<Parent>[]): Promise<void> {
    const supabase = createClient();
    
    // Deduplicate by parent_type so there is never more than 1 FATHER and 1 MOTHER
    const seen = new Set<string>();
    const uniqueRecords: Partial<Parent>[] = [];
    for (let i = records.length - 1; i >= 0; i--) {
      const r = records[i];
      const type = (r.parent_type as string)?.toUpperCase();
      if ((type === 'FATHER' || type === 'MOTHER') && !seen.has(type)) {
        seen.add(type);
        uniqueRecords.unshift({ ...r, parent_type: type as 'FATHER' | 'MOTHER' });
      }
    }

    if (uniqueRecords.length === 0) {
      await supabase.from('parents').delete().eq('profile_id', profileId);
      return;
    }

    // Delete any parent types that are no longer in the list
    const typesPresent = uniqueRecords.map(r => r.parent_type!);
    if (typesPresent.length === 1) {
      const otherType = typesPresent[0] === 'FATHER' ? 'MOTHER' : 'FATHER';
      await supabase.from('parents').delete().eq('profile_id', profileId).eq('parent_type', otherType);
    }

    const sanitized = uniqueRecords.map(r => {
      const ageNum = (r.age != null && (r.age as any) !== '') ? Number(r.age) : null;
      return {
        profile_id: profileId,
        parent_type: r.parent_type as 'FATHER' | 'MOTHER',
        status: (r.status || 'ALIVE') as 'ALIVE' | 'DECEASED',
        full_name: r.full_name || null,
        age: (ageNum !== null && !isNaN(ageNum) && ageNum >= 18 && ageNum <= 120) ? ageNum : null,
        profession: r.profession || null,
        education: r.education || null,
        country_id: r.country_id ? Number(r.country_id) : null,
        city_id: r.city_id ? Number(r.city_id) : null,
        living_arrangement: r.living_arrangement || null,
        social_background: r.social_background || null,
        additional_details: r.additional_details || null,
      };
    });

    // Use upsert to eliminate race conditions and avoid duplicate key errors
    const { error } = await supabase.from('parents').upsert(sanitized, { onConflict: 'profile_id,parent_type' });
    if (error) throw error;
  }

  /**
   * STEP 6B: Siblings
   */
  static async saveSiblings(profileId: string, records: Partial<Sibling>[]): Promise<void> {
    const supabase = createClient();
    await supabase.from('siblings').delete().eq('profile_id', profileId);
    if (records.length > 0) {
      const sanitized = records.map(r => ({
        profile_id: profileId,
        gender: (r.gender || 'MALE') as 'MALE' | 'FEMALE',
        full_name: r.full_name || null,
        age: r.age ? Number(r.age) : null,
        marital_status: r.marital_status || null,
        profession: r.profession || null,
        education: r.education || null,
        country_id: r.country_id ? Number(r.country_id) : null,
        city_id: r.city_id ? Number(r.city_id) : null,
      }));
      const { error } = await supabase.from('siblings').insert(sanitized);
      if (error) throw error;
    }
  }

  /**
   * STEP 6C: Family Info
   */
  static async saveFamilyInfo(profileId: string, data: Partial<FamilyInformation>): Promise<FamilyInformation> {
    const supabase = createClient();
    const { data: existing } = await supabase.from('family_information').select('profile_id').eq('profile_id', profileId).maybeSingle();
    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('family_information').update(data).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('family_information').insert({ ...data, profile_id: profileId }).select().single();
      if (error) throw error;
      result = inserted;
    }
    return result as FamilyInformation;
  }

  /**
   * STEP 7A: Lifestyle Info
   */
  static async saveLifestyleInfo(profileId: string, data: Partial<LifestyleInformation>): Promise<LifestyleInformation> {
    const supabase = createClient();
    const { data: existing } = await supabase.from('lifestyle_information').select('profile_id').eq('profile_id', profileId).maybeSingle();
    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('lifestyle_information').update(data).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('lifestyle_information').insert({ ...data, profile_id: profileId }).select().single();
      if (error) throw error;
      result = inserted;
    }
    return result as LifestyleInformation;
  }

  /**
   * STEP 7B: Relocation Info
   */
  static async saveRelocationInfo(profileId: string, data: Partial<RelocationInformation>): Promise<RelocationInformation> {
    const supabase = createClient();
    const { data: existing } = await supabase.from('relocation_information').select('profile_id').eq('profile_id', profileId).maybeSingle();
    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('relocation_information').update(data).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('relocation_information').insert({ ...data, profile_id: profileId }).select().single();
      if (error) throw error;
      result = inserted;
    }
    return result as RelocationInformation;
  }

  /**
   * READ: Get full profile
   */
  static async getProfileById(profileId: string) {
    const res = await fetch(`/api/profiles/${profileId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch profile');
    }
    return res.json();
  }

  /**
   * READ: Get list of profiles
   */
  static async getProfilesList(filters: ProfileFilters): Promise<{ data: ProfileListItem[], count: number }> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.status) params.set('status', filters.status);
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.search) params.set('search', filters.search);
    if (filters.cityId) params.set('cityId', filters.cityId.toString());
    if (filters.minAge) params.set('minAge', filters.minAge.toString());
    if (filters.maxAge) params.set('maxAge', filters.maxAge.toString());

    const res = await fetch(`/api/profiles?${params.toString()}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch profiles');
    }
    return res.json();
  }

  /**
   * READ: Get profile counts by status (head-only queries, very lightweight)
   */
  static async getProfileStats(): Promise<{ total: number; active: number; draft: number; paused: number; archived: number }> {
    const res = await fetch('/api/profiles/stats');
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch profile stats');
    }
    return res.json();
  }

  /**
   * UPDATE STATUS
   */
  static async updateProfileStatus(profileId: string, status: ProfileStatus): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', profileId);

    if (error) throw error;
  }

  static async touchProfile(profileId: string): Promise<void> {
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', profileId);
  }

  /**
   * READ: Get profile matches (ledger and results) from DB views
   */
  static async getProfileMatches(profileId: string): Promise<{ ledger: any[], results: any[] }> {
    const res = await fetch(`/api/profiles/${profileId}/matches`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch profile matches');
    }
    return res.json();
  }

  /**
   * CHILDREN & PREVIOUS MARRIAGES
   */
  static async saveChildren(profileId: string, data: any[]): Promise<void> {
    const supabase = createClient();
    await supabase.from('children').delete().eq('profile_id', profileId);
    if (data.length > 0) {
      const sanitized = data.map(d => ({
        profile_id: profileId,
        gender: d.gender || null,
        age: d.age ? Number(d.age) : null,
        living_with_profile: d.living_with_profile != null ? Boolean(d.living_with_profile) : null,
        additional_details: d.additional_details || null,
      }));
      const { error } = await supabase.from('children').insert(sanitized);
      if (error) throw error;
    }
  }

  static async savePreviousMarriages(profileId: string, data: any[]): Promise<void> {
    const supabase = createClient();
    await supabase.from('previous_marriages').delete().eq('profile_id', profileId);
    if (data.length > 0) {
      const sanitized = data.map((d, index) => ({
        profile_id: profileId,
        marriage_number: index + 1,
        marriage_status: d.marriage_status || null,
        marriage_year: d.marriage_year ? Number(d.marriage_year) : null,
        end_year: d.end_year ? Number(d.end_year) : null,
        reason_for_end: d.reason_for_end || null,
        children_count: d.children_count ? Number(d.children_count) : 0,
        sons_count: d.sons_count ? Number(d.sons_count) : 0,
        daughters_count: d.daughters_count ? Number(d.daughters_count) : 0,
        children_live_with_profile: d.children_live_with_profile != null ? Boolean(d.children_live_with_profile) : null,
        additional_details: d.additional_details || null,
      }));
      const { error } = await supabase.from('previous_marriages').insert(sanitized);
      if (error) throw error;
    }
  }

  static async deleteProfile(profileId: string): Promise<void> {
    const { deleteProfileViaRpc } = await import('@/lib/actions/profiles');
    const result = await deleteProfileViaRpc(profileId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete profile');
    }
  }

}
