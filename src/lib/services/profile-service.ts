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
      .update({ status })
      .eq('id', profileId);

    if (error) throw error;
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
      const { error } = await supabase.from('children').insert(
        data.map(d => ({ ...d, profile_id: profileId }))
      );
      if (error) throw error;
    }
  }

  static async savePreviousMarriages(profileId: string, data: any[]): Promise<void> {
    const supabase = createClient();
    await supabase.from('previous_marriages').delete().eq('profile_id', profileId);
    if (data.length > 0) {
      const { error } = await supabase.from('previous_marriages').insert(
        data.map((d, index) => ({ ...d, profile_id: profileId, marriage_number: index + 1 }))
      );
      if (error) throw error;
    }
  }

  static async deleteProfile(profileId: string): Promise<void> {
    const supabase = createClient();
    
    // First, fetch the profile to see if it has a picture
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('profile_URL')
      .eq('id', profileId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
    
    // If there's a picture, delete it from storage
    if (profile?.profile_URL) {
      await ProfileService.deleteProfilePicture(profile.profile_URL);
    }
    
    // Delete the profile itself via API to bypass RLS restrictions
    const response = await fetch(`/api/profiles/${profileId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete profile');
    }
  }

}
