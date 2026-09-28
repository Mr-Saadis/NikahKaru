import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Pakistani / Muslim Names
const maleNames = ['Ali', 'Usman', 'Umar', 'Hamza', 'Bilal', 'Hassan', 'Hussain', 'Zain', 'Saad', 'Fahad', 'Waqas', 'Imran', 'Kamran', 'Tariq', 'Adnan', 'Salman', 'Junaid', 'Faisal', 'Zeeshan', 'Rizwan', 'Kashif', 'Farhan', 'Noman', 'Shoaib', 'Taha'];
const femaleNames = ['Fatima', 'Aisha', 'Zainab', 'Maryam', 'Sana', 'Hira', 'Iqra', 'Nida', 'Khadija', 'Sadia', 'Amna', 'Madiha', 'Ayesha', 'Rabia', 'Sobia', 'Saira', 'Anum', 'Hafsa', 'Mahnoor', 'Bisma', 'Kinza', 'Zoya', 'Mehwish', 'Nimra', 'Kiran'];
const lastNames = ['Khan', 'Ali', 'Ahmed', 'Hussain', 'Shah', 'Qureshi', 'Malik', 'Raja', 'Sheikh', 'Javed', 'Iqbal', 'Siddiqui', 'Rehman', 'Chaudhry', 'Tariq', 'Baig', 'Butt', 'Raza'];

async function getRandomReferenceIds() {
  const [
    { data: religions },
    { data: sects },
    { data: castes },
    { data: eduLevels },
    { data: occupations },
    { data: countries },
    { data: tongues }
  ] = await Promise.all([
    supabase.from('religions').select('id'),
    supabase.from('sects').select('id'),
    supabase.from('castes').select('id'),
    supabase.from('education_levels').select('id'),
    supabase.from('occupations').select('id'),
    supabase.from('countries').select('id'),
    supabase.from('mother_tongues').select('id'),
  ]);
  
  return {
    religions: religions?.map(r => r.id) || [null],
    sects: sects?.map(s => s.id) || [null],
    castes: castes?.map(c => c.id) || [null],
    eduLevels: eduLevels?.map(e => e.id) || [null],
    occupations: occupations?.map(o => o.id) || [null],
    countries: countries?.map(c => c.id) || [null],
    tongues: tongues?.map(t => t.id) || [null],
  };
}

function getRandomItem(arr: any[]) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePakistaniName(gender: 'MALE' | 'FEMALE') {
  const firstName = gender === 'MALE' ? getRandomItem(maleNames) : getRandomItem(femaleNames);
  const lastName = getRandomItem(lastNames);
  return `${firstName} ${lastName}`;
}

async function run() {
  console.log('Starting comprehensive seed process with Pakistani names...');

  const { data: users } = await supabase.auth.admin.listUsers();
  const createdBy = users?.users?.[0]?.id || '11111111-1111-1111-1111-111111111111';

  const refs = await getRandomReferenceIds();
  const totalProfiles = 150;
  console.log(`Generating ${totalProfiles} comprehensive profiles...`);

  for (let i = 0; i < totalProfiles; i++) {
    const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
    
    // 1. Profile
    const { data: profile, error: pError } = await supabase.from('profiles').insert({
      gender,
      status: 'ACTIVE',
      created_by: createdBy,
      current_agent_id: createdBy // Assigning to agent so it shows up in UI
    }).select('id').single();

    if (pError || !profile) {
      console.error('Error creating profile:', pError);
      continue;
    }

    const profileId = profile.id;
    const dob = faker.date.birthdate({ min: 20, max: 50, mode: 'age' });
    const age = new Date().getFullYear() - dob.getFullYear();

    // 2. Personal Info
    await supabase.from('personal_information').insert({
      profile_id: profileId,
      full_name: generatePakistaniName(gender),
      date_of_birth: dob.toISOString().split('T')[0],
      marital_status: faker.helpers.arrayElement(['NEVER_MARRIED', 'DIVORCED', 'WIDOWED']),
      number_of_children: faker.number.int({ min: 0, max: 3 }),
      nationality_country_id: getRandomItem(refs.countries),
      mother_tongue_id: getRandomItem(refs.tongues),
    });

    // 3. Physical Info
    const isMale = gender === 'MALE';
    await supabase.from('physical_information').insert({
      profile_id: profileId,
      height_cm: isMale ? faker.number.int({ min: 165, max: 190 }) : faker.number.int({ min: 150, max: 175 }),
      weight_kg: faker.number.int({ min: 50, max: 90 }),
      complexion: faker.helpers.arrayElement(['FAIR', 'WHEATISH', 'DARK']),
      has_disability: faker.datatype.boolean({ probability: 0.05 }),
    });

    // 4. Education
    await supabase.from('education_records').insert({
      profile_id: profileId,
      education_level_id: getRandomItem(refs.eduLevels),
      qualification: 'Bachelors/Masters',
      is_highest_qualification: true
    });

    // 5. Employment
    await supabase.from('employment_records').insert({
      profile_id: profileId,
      occupation_id: getRandomItem(refs.occupations),
      employment_type: faker.helpers.arrayElement(['PRIVATE', 'GOVERNMENT', 'BUSINESS']),
      is_current: true
    });

    // 6. Income
    await supabase.from('income_information').insert({
      profile_id: profileId,
      monthly_income_min: faker.number.int({ min: 50000, max: 100000 }),
      monthly_income_max: faker.number.int({ min: 100001, max: 500000 }),
      currency_code: 'PKR',
      income_period: 'MONTHLY'
    });

    // 7. Religion Info
    await supabase.from('religion_information').insert({
      profile_id: profileId,
      religion_id: getRandomItem(refs.religions),
      sect_id: getRandomItem(refs.sects),
      caste_id: getRandomItem(refs.castes),
    });

    // 8. Locations
    await supabase.from('profile_locations').insert({
      profile_id: profileId,
      current_country_id: getRandomItem(refs.countries),
    });

    // 9. Residency
    await supabase.from('residency_information').insert({
      profile_id: profileId,
      house_status: faker.helpers.arrayElement(['OWN', 'RENTED']),
      family_setup: faker.helpers.arrayElement(['JOINT', 'SEPARATE']),
    });

    // 10. Lifestyle
    await supabase.from('lifestyle_information').insert({
      profile_id: profileId,
      smoking: faker.helpers.arrayElement(['NO', 'YES']),
    });

    // 12. Preference Set & Sub-tables
    const { data: prefSet } = await supabase.from('preference_sets').insert({
      profile_id: profileId,
      version: 1,
      is_current: true,
      created_by: createdBy
    }).select('id').single();

    if (prefSet) {
      const prefMinAge = age - faker.number.int({ min: 2, max: 5 });
      const prefMaxAge = age + faker.number.int({ min: 2, max: 8 });

      await supabase.from('basic_preferences').insert({
        preference_set_id: prefSet.id,
        min_age: Math.max(18, prefMinAge),
        max_age: prefMaxAge,
        age_importance: 'MANDATORY',
        preferred_marital_status: faker.helpers.arrayElement(['NEVER_MARRIED', null]),
        marital_status_importance: 'HIGH'
      });

      await supabase.from('physical_preferences').insert({
        preference_set_id: prefSet.id,
        min_height_cm: isMale ? 150 : 165,
        max_height_cm: isMale ? 175 : 190,
        height_importance: 'HIGH',
      });
      
      await supabase.from('education_preferences').insert({
        preference_set_id: prefSet.id,
        preferred_education_level_ids: [getRandomItem(refs.eduLevels)],
        education_importance: 'MEDIUM'
      });
      
      await supabase.from('profession_preferences').insert({
        preference_set_id: prefSet.id,
        preferred_occupation_ids: [getRandomItem(refs.occupations)],
        profession_importance: 'LOW'
      });
      
      await supabase.from('religion_preferences').insert({
        preference_set_id: prefSet.id,
        preferred_religion_ids: [getRandomItem(refs.religions)],
        preferred_sect_ids: [getRandomItem(refs.sects)],
        religion_importance: 'HIGH'
      });
    }

    if ((i + 1) % 10 === 0) {
      console.log(`Generated ${i + 1}/${totalProfiles} comprehensive profiles...`);
    }
  }

  console.log('Comprehensive seed process completed successfully!');
}

run().catch(console.error);
