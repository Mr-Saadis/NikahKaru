import { createBrowserClient } from '@supabase/ssr';
import type { AllPreferences } from '../types/database.types';

export class PreferenceService {
  /**
   * Save preferences for a profile.
   * This creates a new preference_set version and inserts/updates all 9 preference sub-tables.
   */
  static async savePreferences(profileId: string, data: AllPreferences, createdBy: string): Promise<void> {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Mark existing preference sets as not current
    await supabase
      .from('preference_sets')
      .update({ is_current: false })
      .eq('profile_id', profileId);

    // 2. Determine next version
    const { data: latestSet } = await supabase
      .from('preference_sets')
      .select('version')
      .eq('profile_id', profileId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = latestSet ? latestSet.version + 1 : 1;

    // 3. Create new preference_set
    const { data: newSet, error: setError } = await supabase
      .from('preference_sets')
      .insert({
        profile_id: profileId,
        version: nextVersion,
        is_current: true,
        created_by: createdBy,
      })
      .select('id')
      .single();

    if (setError || !newSet) {
      throw new Error(`Failed to create preference set: ${setError?.message}`);
    }

    const setId = newSet.id;

    // 4. Insert all sub-tables in parallel
    const tasks = [];

    if (data.basic) {
      tasks.push(supabase.from('basic_preferences').insert({ ...data.basic, preference_set_id: setId }));
    }
    if (data.physical) {
      tasks.push(supabase.from('physical_preferences').insert({ ...data.physical, preference_set_id: setId }));
    }
    if (data.education) {
      tasks.push(supabase.from('education_preferences').insert({ ...data.education, preference_set_id: setId }));
    }
    if (data.profession) {
      tasks.push(supabase.from('profession_preferences').insert({ ...data.profession, preference_set_id: setId }));
    }
    if (data.religion) {
      tasks.push(supabase.from('religion_preferences').insert({ ...data.religion, preference_set_id: setId }));
    }
    if (data.location) {
      tasks.push(supabase.from('location_preferences').insert({ ...data.location, preference_set_id: setId }));
    }
    if (data.family) {
      tasks.push(supabase.from('family_preferences').insert({ ...data.family, preference_set_id: setId }));
    }
    if (data.lifestyle) {
      tasks.push(supabase.from('lifestyle_preferences').insert({ ...data.lifestyle, preference_set_id: setId }));
    }
    if (data.relocation) {
      tasks.push(supabase.from('relocation_preferences').insert({ ...data.relocation, preference_set_id: setId }));
    }

    const results = await Promise.all(tasks);
    
    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('Preference insertion error:', result.error);
        throw new Error(`Failed to save a preference section: ${result.error.message}`);
      }
    }
  }

  static async getCurrentPreferences(profileId: string): Promise<AllPreferences | null> {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: prefSet, error } = await supabase
      .from('preference_sets')
      .select('id')
      .eq('profile_id', profileId)
      .eq('is_current', true)
      .single();

    if (error || !prefSet) return null;

    const setId = prefSet.id;

    const [
      basicReq, physicalReq, eduReq, profReq, relReq, locReq, famReq, lifeReq, relocReq
    ] = await Promise.all([
      supabase.from('basic_preferences').select('*').eq('preference_set_id', setId).single(),
      supabase.from('physical_preferences').select('*').eq('preference_set_id', setId).single(),
      supabase.from('education_preferences').select('*').eq('preference_set_id', setId).single(),
      supabase.from('profession_preferences').select('*').eq('preference_set_id', setId).single(),
      supabase.from('religion_preferences').select('*').eq('preference_set_id', setId).single(),
      supabase.from('location_preferences').select('*').eq('preference_set_id', setId).single(),
      supabase.from('family_preferences').select('*').eq('preference_set_id', setId).single(),
      supabase.from('lifestyle_preferences').select('*').eq('preference_set_id', setId).single(),
      supabase.from('relocation_preferences').select('*').eq('preference_set_id', setId).single(),
    ]);

    return {
      basic: basicReq.data || null,
      physical: physicalReq.data || null,
      education: eduReq.data || null,
      profession: profReq.data || null,
      religion: relReq.data || null,
      location: locReq.data || null,
      family: famReq.data || null,
      lifestyle: lifeReq.data || null,
      relocation: relocReq.data || null,
    };
  }
}
