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
   * UPLOAD PROFILE PICTURE
   */
  static async uploadProfilePicture(profileId: string, file: File): Promise<string> {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${profileId}-${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('Profile_Picture')
      .upload(fileName, file);

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
    
    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('personal_information').update(data).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('personal_information').insert({ ...data, profile_id: profileId }).select().single();
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
    
    let result;
    if (existing) {
      const { data: updated, error } = await supabase.from('physical_information').update(data).eq('profile_id', profileId).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase.from('physical_information').insert({ ...data, profile_id: profileId }).select().single();
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
    
    // For arrays, simplest approach is delete all and re-insert, or upsert.
    // Assuming upsert based on ID if provided, otherwise insert.
    // To keep it clean for a multi-step form, we can delete existing and insert new ones
    // if we want to replace the whole list. Let's do a replace-all for simplicity.
    await supabase.from('education_records').delete().eq('profile_id', profileId);
    
    if (records.length > 0) {
      const { error } = await supabase.from('education_records').insert(
        records.map(r => ({ ...r, profile_id: profileId }))
      );
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
      const { error } = await supabase.from('employment_records').insert(
        records.map(r => ({ ...r, profile_id: profileId }))
      );
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
    await supabase.from('parents').delete().eq('profile_id', profileId);
    if (records.length > 0) {
      const { error } = await supabase.from('parents').insert(
        records.map(r => ({ ...r, profile_id: profileId }))
      );
      if (error) throw error;
    }
  }

  /**
   * STEP 6B: Siblings
   */
  static async saveSiblings(profileId: string, records: Partial<Sibling>[]): Promise<void> {
    const supabase = createClient();
    await supabase.from('siblings').delete().eq('profile_id', profileId);
    if (records.length > 0) {
      const { error } = await supabase.from('siblings').insert(
        records.map(r => ({ ...r, profile_id: profileId }))
      );
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
    const supabase = createClient();
    
    // We can fetch everything in one query using joins
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        personal_information (*),
        physical_information (*),
        education_records (*),
        employment_records (*),
        income_information (*),
        religion_information (*),
        profile_locations (*),
        residency_information (*),
        parents (*),
        siblings (*),
        children (*),
        previous_marriages (*),
        family_information (*),
        lifestyle_information (*),
        relocation_information (*)
      `)
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * READ: Get list of profiles
   */
  static async getProfilesList(filters: ProfileFilters): Promise<{ data: ProfileListItem[], count: number }> {
    const supabase = createClient();
    
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select(`
        id, gender, status, profile_URL, created_at, updated_at, current_agent_id,
        personal_information ( full_name, date_of_birth, marital_status ),
        profile_locations ( current_city_id )
      `, { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }
    
    // Note: Advanced filtering like age range and nested field search (name, city)
    // usually requires an RPC or a database view in Supabase.
    // For now, we'll do basic matching for MVP. We can filter name by joining if possible 
    // but PostgREST supports it via nested filtering:
    if (filters.search) {
      query = query.textSearch('personal_information.full_name', filters.search);
    }
    if (filters.cityId) {
      query = query.eq('profile_locations.current_city_id', filters.cityId);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Filter age in JS if provided, since we don't have DB function right now
    let results = data as unknown as ProfileListItem[];
    
    if (filters.minAge || filters.maxAge) {
      results = results.filter(p => {
        if (!p.personal_information?.date_of_birth) return false;
        const dob = new Date(p.personal_information.date_of_birth);
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (filters.minAge && age < filters.minAge) return false;
        if (filters.maxAge && age > filters.maxAge) return false;
        return true;
      });
    }

    return { data: results, count: count || results.length };
  }

  /**
   * READ: Get profile counts by status (head-only queries, very lightweight)
   */
  static async getProfileStats(): Promise<{ total: number; active: number; draft: number; paused: number; archived: number }> {
    const supabase = createClient();
    const [total, active, draft, paused, archived] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'DRAFT'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'PAUSED'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'ARCHIVED'),
    ]);
    return {
      total: total.count || 0,
      active: active.count || 0,
      draft: draft.count || 0,
      paused: paused.count || 0,
      archived: archived.count || 0,
    };
  }

  /**
   * UPDATE STATUS
   */
  static async updateProfileStatus(profileId: string, status: ProfileStatus): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', profileId);

    if (error) throw error;
  }
}
