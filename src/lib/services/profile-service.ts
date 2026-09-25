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
  ProfileStatus
} from '@/lib/types/database.types';

export class ProfileService {
  /**
   * CREATE / INITIALIZE PROFILE
   */
  static async createProfile(userId: string): Promise<Profile> {
    const supabase = createClient();
    
    // As per schema, a profile just needs created_by and current_agent_id
    // It defaults to DRAFT status and generates a short_id
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        created_by: userId,
        current_agent_id: userId,
        status: 'DRAFT',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as Profile;
  }

  /**
   * STEP 1: Personal Information
   */
  static async savePersonalInfo(profileId: string, data: Partial<PersonalInformation>): Promise<PersonalInformation> {
    const supabase = createClient();
    
    // Check if exists
    const { data: existing } = await supabase.from('personal_information').select('id').eq('profile_id', profileId).single();
    
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
    const { data: existing } = await supabase.from('physical_information').select('id').eq('profile_id', profileId).single();
    
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
    const { data: existing } = await supabase.from('income_information').select('id').eq('profile_id', profileId).single();
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
    const { data: existing } = await supabase.from('religion_information').select('id').eq('profile_id', profileId).single();
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
    const { data: existing } = await supabase.from('profile_locations').select('id').eq('profile_id', profileId).single();
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
    const { data: existing } = await supabase.from('residency_information').select('id').eq('profile_id', profileId).single();
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
    const { data: existing } = await supabase.from('family_information').select('id').eq('profile_id', profileId).single();
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
    const { data: existing } = await supabase.from('lifestyle_information').select('id').eq('profile_id', profileId).single();
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
    const { data: existing } = await supabase.from('relocation_information').select('id').eq('profile_id', profileId).single();
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
