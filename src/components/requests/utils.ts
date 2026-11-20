import type { RequestItem } from './types';
import type { MatchResult } from '@/lib/matching/types';
import { useReferenceDataStore } from '@/lib/stores/reference-data-store';

export type ProfileField = [string, string, string?]; // [label, value, field_path]
export type ProfileGroup = [string, ProfileField[]];

export function formatAgeFromDob(dob?: string | number | null): string {
  if (dob === null || dob === undefined || dob === '') return 'N/A';
  if (typeof dob === 'number') {
    return dob >= 0 && dob <= 120 ? `${Math.floor(dob)} yrs` : 'N/A';
  }
  const str = String(dob).trim();
  if (!str) return 'N/A';
  const ageStrMatch = str.match(/^(\d{1,3})\s*(?:yrs?|years?(?:\s+old)?)?$/i);
  if (ageStrMatch) {
    const n = Number(ageStrMatch[1]);
    return n >= 0 && n <= 120 ? `${n} yrs` : 'N/A';
  }
  const birth = new Date(str);
  if (isNaN(birth.getTime())) return 'N/A';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age <= 120 ? `${age} yrs` : 'N/A';
}

export function getMatchProfileGroups(match: any): ProfileGroup[] {
  const d = match?.fullProfile || match?.candidateData;
  if (!d) return [];

  const refStore = useReferenceDataStore.getState();

  const pi = d.personal_information || {};
  const phy = d.physical_information || {};
  const rel = d.religion_information || {};
  const loc = d.profile_locations || {};
  const res = d.residency_information || {};
  const inc = d.income_information || {};
  const fam = d.family_information || {};
  const life = d.lifestyle_information || {};
  const reloc = d.relocation_information || {};

  const eduList: any[] = Array.isArray(d.education_records) ? d.education_records : [];
  const empList: any[] = Array.isArray(d.employment_records) ? d.employment_records : [];
  const parentsList: any[] = Array.isArray(d.parents) ? d.parents : [];
  const siblingsList: any[] = Array.isArray(d.siblings) ? d.siblings : [];
  const childrenList: any[] = Array.isArray(d.children) ? d.children : [];
  const prevMarriagesList: any[] = Array.isArray(d.previous_marriages) ? d.previous_marriages : [];

  const genderRaw = d.gender || pi.gender || null;
  const dobVal = d.date_of_birth || pi.date_of_birth;
  const maritalVal = d.marital_status || pi.marital_status;
  const childrenVal =
    d.number_of_children !== null && d.number_of_children !== undefined
      ? d.number_of_children
      : pi.number_of_children;
  const profilePicUrl = d.profile_url || d.profile_URL || d.profile_picture || pi.profile_picture;

  const nationalityCountryId = d.nationality_country_id || pi.nationality_country_id;
  const nationalityName =
    d.nationality_country_name_en ||
    (nationalityCountryId ? refStore.getCountryById(Number(nationalityCountryId))?.name_en : null) ||
    null;
  const multipleNationality = Boolean(pi.multiple_nationality ?? d.multiple_nationality);
  const motherTongueId = d.mother_tongue_id || pi.mother_tongue_id;
  const motherTongueName =
    d.mother_tongue_name_en ||
    d.mother_tongue ||
    pi.mother_tongue_name_en ||
    (motherTongueId ? refStore.getMotherTongueById(Number(motherTongueId))?.name_en : null) ||
    null;

  // ── 1. Basic Information ────────────────────────────────────────
  const basicFields: ProfileField[] = [
    ...(profilePicUrl ? [["Profile picture", "Include", "personal_information.profile_picture"] as ProfileField] : []),
    ["Full name", d.full_name || pi.full_name || 'N/A', "personal_information.full_name"],
    ...(genderRaw ? [["Gender", formatEnumText(genderRaw), "profile.gender"] as ProfileField] : []),
    ["Phone", d.phone || d.primary_phone || pi.phone || 'N/A', "personal_information.phone"],
    ["CNIC", d.cnic || pi.cnic || 'N/A', "personal_information.cnic"],
    ["Age", formatAgeFromDob(dobVal), "personal_information.date_of_birth"],
    ...(dobVal && /^\d{4}-\d{2}-\d{2}/.test(String(dobVal))
      ? [["Date of Birth", String(dobVal).slice(0, 10), "personal_information.date_of_birth"] as ProfileField]
      : []),
    ["Marital status", maritalVal ? formatEnumText(maritalVal) : 'N/A', "personal_information.marital_status"],
    ...(nationalityName ? [["Nationality", nationalityName, "personal_information.nationality_country_id"] as ProfileField] : []),
    ...(multipleNationality ? [["Dual Nationality", "Yes", "personal_information.multiple_nationality"] as ProfileField] : []),
    ...(motherTongueName ? [["Mother tongue", motherTongueName, "personal_information.mother_tongue_id"] as ProfileField] : []),
  ];

  if (maritalVal && maritalVal !== 'NEVER_MARRIED') {
    if (childrenVal !== null && childrenVal !== undefined) {
      basicFields.push(["Children", String(childrenVal), "personal_information.number_of_children"]);
    }
    childrenList.forEach((ch: any, idx: number) => {
      const chGender = formatEnumText(ch.gender);
      const chAge = ch.age !== null && ch.age !== undefined && ch.age !== '' ? `${ch.age} yrs` : '';
      const chLiving =
        ch.living_with_profile === true || ch.living_with_profile === 'YES'
          ? 'Living Together'
          : ch.living_with_profile === false || ch.living_with_profile === 'NO'
            ? 'Living Separately'
            : '';
      const chDetails = ch.additional_details ? String(ch.additional_details).trim() : '';
      const summary = [chGender, chAge, chLiving, chDetails].filter(Boolean).join(' • ');
      if (summary) {
        basicFields.push([`Child #${idx + 1}`, summary, "children"]);
      }
    });
    prevMarriagesList.forEach((pm: any, idx: number) => {
      const pmStatus = formatEnumText(pm.marriage_status);
      const pmYears =
        pm.marriage_year || pm.end_year ? `${pm.marriage_year || '?'} – ${pm.end_year || '?'}` : '';
      const pmReason = pm.reason_for_end ? `Reason: ${String(pm.reason_for_end).trim()}` : '';
      const pmChildren =
        pm.children_count !== null && pm.children_count !== undefined && Number(pm.children_count) > 0
          ? `Children: ${pm.children_count}`
          : '';
      const pmLiving =
        Number(pm.children_count) > 0
          ? pm.children_live_with_profile === true || pm.children_live_with_profile === 'YES'
            ? 'Live Together'
            : pm.children_live_with_profile === false || pm.children_live_with_profile === 'NO'
              ? 'Live Separately'
              : ''
          : '';
      const pmDetails = pm.additional_details ? String(pm.additional_details).trim() : '';
      const summary = [pmStatus, pmYears, pmReason, pmChildren, pmLiving, pmDetails]
        .filter(Boolean)
        .join(' • ');
      if (summary) {
        basicFields.push([`Previous Marriage #${idx + 1}`, summary, "previous_marriages"]);
      }
    });
  }

  // ── 2. Physical Attributes ──────────────────────────────────────
  const heightCm = d.height_cm ?? phy.height_cm;
  const weightKg = d.weight_kg ?? phy.weight_kg;
  const complexionRaw = d.complexion || phy.complexion;
  const hasDisability = d.has_disability ?? phy.has_disability;
  const disabilityDetails = d.disability_details || phy.disability_details;
  const disabilityText = hasDisability ? (disabilityDetails ? `Yes - ${disabilityDetails}` : "Yes") : "No";

  const physicalFields: ProfileField[] = [
    ["Height", heightCm ? `${heightCm} cm` : 'N/A', "physical_information.height_cm"],
    ...(weightKg ? [["Weight", `${weightKg} kg`, "physical_information.weight_kg"] as ProfileField] : []),
    ...(complexionRaw ? [["Complexion", formatEnumText(complexionRaw), "physical_information.complexion"] as ProfileField] : []),
    ["Disability", disabilityText, "physical_information.has_disability"],
  ];

  // ── 3. Education & Profession ───────────────────────────────────
  const highestEdu = eduList.find((e) => e.is_highest_qualification) || eduList[0];
  const eduLevelName =
    highestEdu?.education_level_name_en ||
    (highestEdu?.education_level_id
      ? refStore.getEducationLevelById(Number(highestEdu.education_level_id))?.name_en
      : null) ||
    d.education_level_name_en ||
    null;
  const qualification = highestEdu?.qualification || d.qualification || null;
  const fieldOfStudy = highestEdu?.field_of_study || d.field_of_study || null;
  const institutionName = highestEdu?.institution_name || d.institution_name || null;
  const eduYears =
    highestEdu?.start_year || highestEdu?.end_year
      ? `${highestEdu.start_year || '?'} – ${highestEdu.end_year || 'Present'}`
      : null;
  const eduDetails = highestEdu?.details ? String(highestEdu.details).trim() : null;

  const currentEmp = empList.find((e) => e.is_current) || empList[0];
  const occName =
    currentEmp?.occupation_name_en ||
    (currentEmp?.occupation_id
      ? refStore.getOccupationById(Number(currentEmp.occupation_id))?.name_en
      : null) ||
    d.occupation_name_en ||
    null;
  const jobTitle = currentEmp?.job_title || d.job_title || null;
  const orgName = currentEmp?.organization_name || d.organization_name || null;
  const empType = currentEmp?.employment_type ? formatEnumText(currentEmp.employment_type) : null;
  const empDetails = currentEmp?.details ? String(currentEmp.details).trim() : null;

  const minInc = d.monthly_income_min ?? inc.monthly_income_min;
  const maxInc = d.monthly_income_max ?? inc.monthly_income_max;
  let incomeText = '';
  if (minInc != null && minInc !== '' && maxInc != null && maxInc !== '' && Number(maxInc) > Number(minInc)) {
    incomeText = `Rs ${Number(minInc).toLocaleString()} - ${Number(maxInc).toLocaleString()}`;
  } else if (minInc != null && minInc !== '') {
    incomeText = `Rs ${Number(minInc).toLocaleString()}`;
  } else if (maxInc != null && maxInc !== '') {
    incomeText = `Up to Rs ${Number(maxInc).toLocaleString()}`;
  }

  const eduProfFields: ProfileField[] = [];
  if (eduLevelName || qualification) {
    eduProfFields.push(["Education Level", (eduLevelName || qualification)!, "education_records"]);
  }
  if (qualification && eduLevelName && qualification.toLowerCase() !== eduLevelName.toLowerCase()) {
    eduProfFields.push(["Qualification", qualification, "education_records"]);
  }
  if (fieldOfStudy) {
    eduProfFields.push(["Field of Study", fieldOfStudy, "education_records"]);
  }
  if (institutionName) {
    eduProfFields.push(["Institution", institutionName, "education_records"]);
  }
  if (eduYears) {
    eduProfFields.push(["Education Years", eduYears, "education_records"]);
  }
  if (eduDetails) {
    eduProfFields.push(["Education Details", eduDetails, "education_records"]);
  }
  if (eduList.length > 1) {
    eduList.forEach((edu: any, idx: number) => {
      const lvl =
        edu.education_level_name_en ||
        (edu.education_level_id ? refStore.getEducationLevelById(Number(edu.education_level_id))?.name_en : '');
      const yrs = edu.start_year || edu.end_year ? `${edu.start_year || '?'}–${edu.end_year || 'Present'}` : '';
      const summary = [lvl, edu.qualification, edu.field_of_study, edu.institution_name, yrs, edu.details]
        .filter(Boolean)
        .join(' • ');
      if (summary) {
        eduProfFields.push([`Education #${idx + 1}`, summary, "education_records"]);
      }
    });
  }
  if (occName) {
    eduProfFields.push(["Occupation", occName, "employment_records"]);
  }
  if (jobTitle) {
    eduProfFields.push(["Job Title", jobTitle, "employment_records"]);
  }
  if (orgName) {
    eduProfFields.push(["Organization", orgName, "employment_records"]);
  }
  if (empType) {
    eduProfFields.push(["Employment Type", empType, "employment_records"]);
  }
  if (empDetails) {
    eduProfFields.push(["Employment Details", empDetails, "employment_records"]);
  }
  if (empList.length > 1) {
    empList.forEach((emp: any, idx: number) => {
      const occ =
        emp.occupation_name_en ||
        (emp.occupation_id ? refStore.getOccupationById(Number(emp.occupation_id))?.name_en : '');
      const empT = emp.employment_type ? formatEnumText(emp.employment_type) : '';
      const statusTag = emp.is_current ? 'Current' : 'Past';
      const summary = [emp.job_title, occ, emp.organization_name, empT, statusTag, emp.details]
        .filter(Boolean)
        .join(' • ');
      if (summary) {
        eduProfFields.push([`Employment #${idx + 1}`, summary, "employment_records"]);
      }
    });
  }
  if (incomeText) {
    eduProfFields.push(["Income", incomeText, "income_information.monthly_income_min"]);
  }

  // ── 4. Religion & Culture ───────────────────────────────────────
  const religionId = d.religion_id || rel.religion_id;
  const religionName =
    d.religion_name_en ||
    d.religion ||
    rel.religion_name_en ||
    (religionId ? refStore.getReligionById(Number(religionId))?.name_en : null) ||
    'Islam';
  const sectId = d.sect_id || rel.sect_id;
  const sectName =
    d.sect_name_en ||
    d.sect ||
    rel.sect_name_en ||
    (sectId ? refStore.getSectById(Number(sectId))?.name_en : null) ||
    null;
  const casteId = d.caste_id || rel.caste_id;
  const casteName =
    d.caste_name_en ||
    d.caste ||
    rel.caste_name_en ||
    (casteId ? refStore.getCasteById(Number(casteId))?.name_en : null) ||
    null;
  const otherCasteText = (d.other_caste_text || rel.other_caste_text || '').trim() || null;

  const religionFields: ProfileField[] = [
    ["Religion", religionName, "religion_information.religion_id"],
    ...(sectName ? [["Sect", sectName, "religion_information.sect_id"] as ProfileField] : []),
    ...(casteName || otherCasteText
      ? [["Caste", (casteName || otherCasteText)!, "religion_information.caste_id"] as ProfileField]
      : []),
    ...(casteName && otherCasteText
      ? [["Other Caste", otherCasteText, "religion_information.other_caste_text"] as ProfileField]
      : []),
    ...(motherTongueName
      ? [["Mother tongue", motherTongueName, "personal_information.mother_tongue_id"] as ProfileField]
      : []),
  ];

  // ── 5. Location & Residency ─────────────────────────────────────
  const currCountryId = d.current_country_id || loc.current_country_id;
  const currCountryName =
    d.current_country_name_en ||
    d.current_country ||
    loc.current_country_name_en ||
    (currCountryId ? refStore.getCountryById(Number(currCountryId))?.name_en : null) ||
    null;
  const currProvId = d.current_province_id || loc.current_province_id;
  const currProvName =
    d.current_province_name_en ||
    loc.current_province_name_en ||
    (currProvId ? refStore.getProvinceById(Number(currProvId))?.name_en : null) ||
    null;
  const currCityId = d.current_city_id || loc.current_city_id;
  const currCityName =
    d.current_city_name_en ||
    loc.current_city_name_en ||
    (currCityId ? refStore.getCityById(Number(currCityId))?.name_en : null) ||
    null;
  const currLocText = (d.current_location_text || loc.current_location_text || '').trim() || null;

  const permCountryId = d.permanent_country_id || loc.permanent_country_id;
  const permCountryName =
    d.permanent_country_name_en ||
    loc.permanent_country_name_en ||
    (permCountryId ? refStore.getCountryById(Number(permCountryId))?.name_en : null) ||
    null;
  const permProvId = d.permanent_province_id || loc.permanent_province_id;
  const permProvName =
    d.permanent_province_name_en ||
    loc.permanent_province_name_en ||
    (permProvId ? refStore.getProvinceById(Number(permProvId))?.name_en : null) ||
    null;
  const permCityId = d.permanent_city_id || loc.permanent_city_id;
  const permCityName =
    d.permanent_city_name_en ||
    loc.permanent_city_name_en ||
    (permCityId ? refStore.getCityById(Number(permCityId))?.name_en : null) ||
    null;
  const permLocText = (d.permanent_location_text || loc.permanent_location_text || '').trim() || null;

  const houseStatusRaw = d.house_status || res.house_status || null;
  const propertyTypeRaw = d.property_type || res.property_type || null;
  const familySetupRaw = d.family_setup || res.family_setup || null;
  const livingWithRaw = d.living_with || res.living_with || null;
  const livingWithOther = (d.living_with_other_details || res.living_with_other_details || '').trim() || null;

  const locationFields: ProfileField[] = [
    ...(currCountryName ? [["Current country", currCountryName, "profile_locations.current_country_id"] as ProfileField] : []),
    ...(currProvName ? [["Current province", currProvName, "profile_locations.current_province_id"] as ProfileField] : []),
    ...(currCityName || currLocText
      ? [["Current city", (currCityName || currLocText)!, "profile_locations.current_city_id"] as ProfileField]
      : []),
    ...(currCityName && currLocText && currLocText.toLowerCase() !== currCityName.toLowerCase()
      ? [["Current address", currLocText, "profile_locations.current_location_text"] as ProfileField]
      : []),
    ...(permCountryName ? [["Permanent country", permCountryName, "profile_locations.permanent_country_id"] as ProfileField] : []),
    ...(permProvName ? [["Permanent province", permProvName, "profile_locations.permanent_province_id"] as ProfileField] : []),
    ...(permCityName || permLocText
      ? [["Permanent city", (permCityName || permLocText)!, "profile_locations.permanent_city_id"] as ProfileField]
      : []),
    ...(permCityName && permLocText && permLocText.toLowerCase() !== permCityName.toLowerCase()
      ? [["Permanent address", permLocText, "profile_locations.permanent_location_text"] as ProfileField]
      : []),
    ...(houseStatusRaw ? [["House status", formatEnumText(houseStatusRaw), "residency_information.house_status"] as ProfileField] : []),
    ...(propertyTypeRaw ? [["Property type", formatEnumText(propertyTypeRaw), "residency_information.property_type"] as ProfileField] : []),
    ...(familySetupRaw ? [["Family Setup", formatEnumText(familySetupRaw), "residency_information.family_setup"] as ProfileField] : []),
    ...(livingWithRaw
      ? [[
          "Living With",
          livingWithRaw === 'OTHER' && livingWithOther
            ? `Other - ${livingWithOther}`
            : formatEnumText(livingWithRaw),
          "residency_information.living_with",
        ] as ProfileField]
      : []),
  ];

  // ── 6. Family Details ───────────────────────────────────────────
  const familyFields: ProfileField[] = [];

  const father = parentsList.find((p: any) => p.parent_type === 'FATHER');
  if (father) {
    if (father.full_name) familyFields.push(["Father Name", father.full_name, "parents"]);
    const fStatus = [formatEnumText(father.status), father.age ? `${father.age} yrs` : ''].filter(Boolean).join(', ');
    if (fStatus) familyFields.push(["Father Status", fStatus, "parents"]);
    if (father.profession) familyFields.push(["Father Profession", father.profession, "parents"]);
    if (father.education) familyFields.push(["Father Education", father.education, "parents"]);
    const fCity = father.city_name_en || (father.city_id ? refStore.getCityById(Number(father.city_id))?.name_en : '');
    const fCountry = father.country_name_en || (father.country_id ? refStore.getCountryById(Number(father.country_id))?.name_en : '');
    const fLoc = [fCity, fCountry].filter(Boolean).join(', ');
    if (fLoc) familyFields.push(["Father Location", fLoc, "parents"]);
    const fNotes = [father.living_arrangement, father.social_background, father.additional_details]
      .map((s) => (s ? String(s).trim() : ''))
      .filter(Boolean)
      .join(' • ');
    if (fNotes) familyFields.push(["Father Details", fNotes, "parents"]);
  }

  const mother = parentsList.find((p: any) => p.parent_type === 'MOTHER');
  if (mother) {
    if (mother.full_name) familyFields.push(["Mother Name", mother.full_name, "parents"]);
    const mStatus = [formatEnumText(mother.status), mother.age ? `${mother.age} yrs` : ''].filter(Boolean).join(', ');
    if (mStatus) familyFields.push(["Mother Status", mStatus, "parents"]);
    if (mother.profession) familyFields.push(["Mother Profession", mother.profession, "parents"]);
    if (mother.education) familyFields.push(["Mother Education", mother.education, "parents"]);
    const mCity = mother.city_name_en || (mother.city_id ? refStore.getCityById(Number(mother.city_id))?.name_en : '');
    const mCountry = mother.country_name_en || (mother.country_id ? refStore.getCountryById(Number(mother.country_id))?.name_en : '');
    const mLoc = [mCity, mCountry].filter(Boolean).join(', ');
    if (mLoc) familyFields.push(["Mother Location", mLoc, "parents"]);
    const mNotes = [mother.living_arrangement, mother.social_background, mother.additional_details]
      .map((s) => (s ? String(s).trim() : ''))
      .filter(Boolean)
      .join(' • ');
    if (mNotes) familyFields.push(["Mother Details", mNotes, "parents"]);
  }

  if (siblingsList.length > 0) {
    const brothers = siblingsList.filter((s: any) => s.gender === 'MALE').length;
    const sisters = siblingsList.filter((s: any) => s.gender === 'FEMALE').length;
    const countParts: string[] = [];
    if (brothers > 0) countParts.push(`${brothers} Brother${brothers > 1 ? 's' : ''}`);
    if (sisters > 0) countParts.push(`${sisters} Sister${sisters > 1 ? 's' : ''}`);
    familyFields.push([
      "Siblings Count",
      countParts.length > 0 ? `${countParts.join(', ')} (Total: ${siblingsList.length})` : String(siblingsList.length),
      "siblings",
    ]);

    let broIdx = 0;
    let sisIdx = 0;
    siblingsList.forEach((sib: any, idx: number) => {
      const isBro = sib.gender === 'MALE';
      const isSis = sib.gender === 'FEMALE';
      const label = isBro ? `Brother #${++broIdx}` : isSis ? `Sister #${++sisIdx}` : `Sibling #${idx + 1}`;
      const sCity = sib.city_name_en || (sib.city_id ? refStore.getCityById(Number(sib.city_id))?.name_en : '');
      const sCountry = sib.country_name_en || (sib.country_id ? refStore.getCountryById(Number(sib.country_id))?.name_en : '');
      const sLoc = [sCity, sCountry].filter(Boolean).join(', ');
      const summary = [
        sib.full_name,
        sib.age ? `${sib.age} yrs` : '',
        formatEnumText(sib.marital_status),
        sib.profession,
        sib.education,
        sLoc,
      ]
        .filter(Boolean)
        .join(' • ');
      if (summary) {
        familyFields.push([label, summary, "siblings"]);
      }
    });
  }

  const famProf = (d.family_profession_business || fam.family_profession_business || '').trim() || null;
  const famSocial = (d.social_background || fam.social_background || '').trim() || null;
  const famValues = (d.family_values || fam.family_values || '').trim() || null;
  const famIntro = (d.family_introduction || fam.family_introduction || '').trim() || null;
  const famCircumstances = (d.important_family_circumstances || fam.important_family_circumstances || '').trim() || null;
  const famAddDetails = (d.family_additional_details || fam.additional_details || '').trim() || null;

  if (famProf) familyFields.push(["Family Profession", famProf, "family_information.family_profession_business"]);
  if (famSocial) familyFields.push(["Social Background", famSocial, "family_information.social_background"]);
  if (famValues) familyFields.push(["Family Values", famValues, "family_information.family_values"]);
  if (famIntro) familyFields.push(["Family Introduction", famIntro, "family_information.family_introduction"]);
  if (famCircumstances) familyFields.push(["Family Circumstances", famCircumstances, "family_information.important_family_circumstances"]);
  if (famAddDetails) familyFields.push(["Additional Family Info", famAddDetails, "family_information.additional_details"]);
  if (familySetupRaw) familyFields.push(["Family Setup", formatEnumText(familySetupRaw), "residency_information.family_setup"]);
  if (livingWithRaw) {
    familyFields.push([
      "Living With",
      livingWithRaw === 'OTHER' && livingWithOther ? `Other - ${livingWithOther}` : formatEnumText(livingWithRaw),
      "residency_information.living_with",
    ]);
  }

  // ── 7. Lifestyle & Relocation ───────────────────────────────────
  const religiousPracticeRaw = d.religious_practice || life.religious_practice || null;
  const beardRaw = d.beard || life.beard || null;
  const hijabRaw = d.hijab || life.hijab || null;
  const smokingRaw = d.smoking || life.smoking || null;
  const otherLifestyle = (d.other_lifestyle_information || life.other_lifestyle_information || '').trim() || null;

  const willingToRelocateRaw = d.willing_to_relocate || reloc.willing_to_relocate || null;
  const relocCountryId = d.preferred_country_id || reloc.preferred_country_id;
  const relocCountryName = relocCountryId ? refStore.getCountryById(Number(relocCountryId))?.name_en : null;
  const relocProvinceId = d.preferred_province_id || reloc.preferred_province_id;
  const relocProvinceName = relocProvinceId ? refStore.getProvinceById(Number(relocProvinceId))?.name_en : null;
  const relocCityId = d.preferred_city_id || reloc.preferred_city_id;
  const relocCityName = relocCityId ? refStore.getCityById(Number(relocCityId))?.name_en : null;
  const relocDetails = (d.relocation_details || reloc.relocation_details || '').trim() || null;

  const lifestyleFields: ProfileField[] = [
    ...(religiousPracticeRaw ? [["Prayer", formatEnumText(religiousPracticeRaw), "lifestyle_information.religious_practice"] as ProfileField] : []),
    ...(genderRaw !== 'FEMALE' && beardRaw ? [["Beard", formatEnumText(beardRaw), "lifestyle_information.beard"] as ProfileField] : []),
    ...(genderRaw !== 'MALE' && hijabRaw ? [["Hijab", formatEnumText(hijabRaw), "lifestyle_information.hijab"] as ProfileField] : []),
    ...(smokingRaw ? [["Smoking", formatEnumText(smokingRaw), "lifestyle_information.smoking"] as ProfileField] : []),
    ...(otherLifestyle ? [["Lifestyle Notes", otherLifestyle, "lifestyle_information.other_lifestyle_information"] as ProfileField] : []),
    ...(willingToRelocateRaw ? [["Willing to Relocate", formatEnumText(willingToRelocateRaw), "relocation_information.willing_to_relocate"] as ProfileField] : []),
    ...(relocCountryName ? [["Relocation Country", relocCountryName, "relocation_information.preferred_country_id"] as ProfileField] : []),
    ...(relocProvinceName ? [["Relocation Province", relocProvinceName, "relocation_information.preferred_province_id"] as ProfileField] : []),
    ...(relocCityName ? [["Relocation City", relocCityName, "relocation_information.preferred_city_id"] as ProfileField] : []),
    ...(relocDetails ? [["Relocation Details", relocDetails, "relocation_information.relocation_details"] as ProfileField] : []),
  ];

  const allGroups: ProfileGroup[] = [
    ["Basic Information", basicFields],
    ["Physical Attributes", physicalFields],
    ["Education & Profession", eduProfFields],
    ["Religion & Culture", religionFields],
    ["Location & Residency", locationFields],
    ["Family Details", familyFields],
    ["Lifestyle", lifestyleFields],
  ];

  return allGroups.filter(([_, fields]) => fields.length > 0);
}


function formatImportance(imp?: string | null): string {
  if (!imp) return '';
  switch (imp.toUpperCase()) {
    case 'MANDATORY':
      return 'Must Have';
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    case 'LOW':
      return 'Low';
    case 'DOESNT_MATTER':
    case 'DOES_NOT_MATTER':
      return "Doesn't Matter";
    default:
      return imp.replace(/_/g, ' ');
  }
}

function formatEnumText(val?: string | null): string {
  if (!val) return '';
  return String(val)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPrefItem(
  value: string | null | undefined,
  importance?: string | null
): string {
  const impLabel = formatImportance(importance);

  if (!value || value.trim() === '') {
    if (impLabel && impLabel !== "Doesn't Matter") {
      return `Any (${impLabel})`;
    }
    return "Doesn't Matter";
  }

  if (impLabel) {
    return `${value} (${impLabel})`;
  }

  return value;
}

function cmToFtIn(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${ft}'${inches}"`;
}

function formatLocationEntry(
  loc: { country_id?: number | null; province_id?: number | null; city_id?: number | null },
  refStore: ReturnType<typeof useReferenceDataStore.getState>
): string {
  const city = loc.city_id ? refStore.getCityById(Number(loc.city_id))?.name_en : null;
  const prov = loc.province_id ? refStore.getProvinceById(Number(loc.province_id))?.name_en : null;
  const country = loc.country_id ? refStore.getCountryById(Number(loc.country_id))?.name_en : null;
  return [city, prov, country].filter(Boolean).join(', ');
}

export function formatPartnerPreferences(preferences?: any, isLoadingPrefs?: boolean, gender?: string): ProfileField[] {
  if (isLoadingPrefs) {
    return [["Status", "Loading partner preferences…"]];
  }

  if (!preferences || Object.keys(preferences).length === 0) {
    return [["Preferences", "No specific partner preferences recorded"]];
  }

  const { basic, physical, education, profession, religion, location, family, lifestyle, relocation } = preferences;
  const prefLocations: any[] = preferences.preferredLocations || preferences.preferred_locations || [];
  const prefRelocations: any[] = preferences.preferredRelocations || preferences.preferred_relocations || [];
  const refStore = useReferenceDataStore.getState();
  const fields: ProfileField[] = [];

  // 1. Basic Preferences
  let ageVal: string | null = null;
  if (basic?.min_age && basic?.max_age) {
    ageVal = `${basic.min_age} - ${basic.max_age} yrs`;
  } else if (basic?.min_age) {
    ageVal = `${basic.min_age}+ yrs`;
  } else if (basic?.max_age) {
    ageVal = `Up to ${basic.max_age} yrs`;
  }
  fields.push(["Desired Age", formatPrefItem(ageVal, basic?.age_importance)]);

  const prefMarital = basic?.preferred_marital_status;
  const maritalVal = prefMarital ? formatEnumText(prefMarital) : null;
  fields.push(["Marital Status", formatPrefItem(maritalVal, basic?.marital_status_importance)]);

  // When marital status in partner preferences is never married, do not show children allowed
  if (prefMarital !== 'NEVER_MARRIED') {
    const childrenVal = basic?.children_allowed === 'YES' ? 'Yes' : basic?.children_allowed === 'NO' ? 'No' : null;
    fields.push(["Children Allowed", formatPrefItem(childrenVal, basic?.children_importance)]);
  }

  // 2. Physical Attributes
  let heightVal: string | null = null;
  if (physical?.min_height_cm && physical?.max_height_cm) {
    heightVal = `${cmToFtIn(Number(physical.min_height_cm))} - ${cmToFtIn(Number(physical.max_height_cm))} (${physical.min_height_cm} - ${physical.max_height_cm} cm)`;
  } else if (physical?.min_height_cm) {
    heightVal = `${cmToFtIn(Number(physical.min_height_cm))}+ (${physical.min_height_cm} cm+)`;
  } else if (physical?.max_height_cm) {
    heightVal = `Up to ${cmToFtIn(Number(physical.max_height_cm))} (${physical.max_height_cm} cm)`;
  }
  fields.push(["Desired Height", formatPrefItem(heightVal, physical?.height_importance)]);

  let weightVal: string | null = null;
  if (physical?.min_weight_kg && physical?.max_weight_kg) {
    weightVal = `${physical.min_weight_kg} - ${physical.max_weight_kg} kg`;
  } else if (physical?.min_weight_kg) {
    weightVal = `${physical.min_weight_kg}+ kg`;
  } else if (physical?.max_weight_kg) {
    weightVal = `Up to ${physical.max_weight_kg} kg`;
  }
  fields.push(["Desired Weight", formatPrefItem(weightVal, physical?.weight_importance)]);

  fields.push(["Complexion", formatPrefItem(physical?.preferred_complexion, physical?.complexion_importance)]);

  const disabilityVal = physical?.disability_allowed === 'YES' ? 'Yes' : physical?.disability_allowed === 'NO' ? 'No' : null;
  fields.push(["Disability Allowed", formatPrefItem(disabilityVal, physical?.disability_importance)]);

  // For male profile (looking for female bride), do not show beard preference
  if (gender !== 'MALE') {
    const beardRaw = physical?.beard_preference || lifestyle?.beard_preference;
    const beardImp = physical?.beard_importance || lifestyle?.beard_importance;
    const beardVal = beardRaw === 'YES' ? 'Yes' : beardRaw === 'NO' ? 'No' : null;
    fields.push(["Beard Preference", formatPrefItem(beardVal, beardImp)]);
  }

  // For female profile (looking for male groom), do not show hijab preference
  if (gender !== 'FEMALE') {
    const hijabRaw = physical?.hijab_preference || lifestyle?.hijab_preference;
    const hijabImp = physical?.hijab_importance || lifestyle?.hijab_importance;
    const hijabVal = hijabRaw === 'YES' ? 'Yes' : hijabRaw === 'NO' ? 'No' : null;
    fields.push(["Hijab Preference", formatPrefItem(hijabVal, hijabImp)]);
  }

  // 3. Education & Profession
  const minEduName =
    education?.minimum_education_level_name_en ||
    (education?.minimum_education_level_id
      ? refStore.getEducationLevelById(Number(education.minimum_education_level_id))?.name_en
      : null);
  fields.push(["Min Education", formatPrefItem(minEduName, education?.education_importance)]);
  fields.push(["Field of Study", formatPrefItem(education?.preferred_field_of_study, education?.field_importance)]);

  const prefOccName =
    profession?.preferred_occupation_name_en ||
    (profession?.preferred_occupation_id
      ? refStore.getOccupationById(Number(profession.preferred_occupation_id))?.name_en
      : null);
  fields.push(["Preferred Profession", formatPrefItem(prefOccName, profession?.occupation_importance)]);

  const empTypeVal = profession?.preferred_employment_type
    ? formatEnumText(profession.preferred_employment_type)
    : null;
  fields.push(["Employment Type", formatPrefItem(empTypeVal, profession?.employment_type_importance)]);

  let incomeVal: string | null = null;
  if (profession?.minimum_monthly_income && profession?.maximum_monthly_income) {
    incomeVal = `Rs ${Number(profession.minimum_monthly_income).toLocaleString()} - ${Number(profession.maximum_monthly_income).toLocaleString()}`;
  } else if (profession?.minimum_monthly_income) {
    incomeVal = `Rs ${Number(profession.minimum_monthly_income).toLocaleString()}+`;
  } else if (profession?.maximum_monthly_income) {
    incomeVal = `Up to Rs ${Number(profession.maximum_monthly_income).toLocaleString()}`;
  }
  fields.push(["Monthly Income", formatPrefItem(incomeVal, profession?.income_importance)]);

  // 4. Religion & Culture
  const prefReligionName =
    religion?.religion_name_en ||
    (religion?.religion_id ? refStore.getReligionById(Number(religion.religion_id))?.name_en : null);
  const prefSectName =
    religion?.sect_name_en ||
    (religion?.sect_id ? refStore.getSectById(Number(religion.sect_id))?.name_en : null);
  const prefCasteName =
    religion?.caste_name_en ||
    (religion?.caste_id ? refStore.getCasteById(Number(religion.caste_id))?.name_en : null);

  fields.push(["Religion", formatPrefItem(prefReligionName, religion?.religion_importance)]);
  fields.push(["Sect", formatPrefItem(prefSectName, religion?.sect_importance)]);
  fields.push(["Caste", formatPrefItem(prefCasteName, religion?.caste_importance)]);

  const practiceRaw = religion?.religious_practice || lifestyle?.religious_practice;
  const practiceImp = religion?.religious_practice_importance || lifestyle?.religious_practice_importance;
  const practiceVal = practiceRaw ? formatEnumText(practiceRaw) : null;
  fields.push(["Religious Practice", formatPrefItem(practiceVal, practiceImp)]);

  // 5. Location Preferences (preferred_locations array + legacy single columns)
  if (prefLocations.length > 0) {
    const includedRows = prefLocations.filter((l: any) => !l.is_excluded);
    const excludedRows = prefLocations.filter((l: any) => l.is_excluded);

    const uniqueCountries = Array.from(
      new Set(
        includedRows
          .map((l: any) => (l.country_id ? refStore.getCountryById(Number(l.country_id))?.name_en : null))
          .filter(Boolean)
      )
    );
    const uniqueProvinces = Array.from(
      new Set(
        includedRows
          .map((l: any) => (l.province_id ? refStore.getProvinceById(Number(l.province_id))?.name_en : null))
          .filter(Boolean)
      )
    );
    const uniqueCities = Array.from(
      new Set(
        includedRows
          .map((l: any) => (l.city_id ? refStore.getCityById(Number(l.city_id))?.name_en : null))
          .filter(Boolean)
      )
    );

    fields.push(["Preferred Country", formatPrefItem(uniqueCountries.join(', ') || null, location?.country_importance)]);
    fields.push(["Preferred Province", formatPrefItem(uniqueProvinces.join(', ') || null, location?.province_importance)]);
    fields.push(["Preferred City", formatPrefItem(uniqueCities.join(', ') || null, location?.city_importance)]);

    const includedLocs = includedRows
      .map((l: any) => formatLocationEntry(l, refStore))
      .filter(Boolean);
    const excludedLocs = excludedRows
      .map((l: any) => formatLocationEntry(l, refStore))
      .filter(Boolean);

    const locImp =
      location?.city_importance || location?.province_importance || location?.country_importance || null;

    if (includedLocs.length > 0) {
      fields.push(["Preferred Locations", formatPrefItem(includedLocs.join(' • '), locImp)]);
    }
    if (excludedLocs.length > 0) {
      fields.push(["Excluded Locations", excludedLocs.join(' • ')]);
    }
  } else {
    const prefLocCountry =
      location?.country_name_en ||
      (location?.country_id ? refStore.getCountryById(Number(location.country_id))?.name_en : null);
    const prefLocProvince =
      location?.province_name_en ||
      (location?.province_id ? refStore.getProvinceById(Number(location.province_id))?.name_en : null);
    const prefLocCity =
      location?.city_name_en ||
      (location?.city_id ? refStore.getCityById(Number(location.city_id))?.name_en : null);

    fields.push(["Preferred Country", formatPrefItem(prefLocCountry, location?.country_importance)]);
    fields.push(["Preferred Province", formatPrefItem(prefLocProvince, location?.province_importance)]);
    fields.push(["Preferred City", formatPrefItem(prefLocCity, location?.city_importance)]);
  }

  // 6. Family & Living
  const familySetupVal = family?.family_setup ? formatEnumText(family.family_setup) : null;
  fields.push(["Family Setup", formatPrefItem(familySetupVal, family?.family_setup_importance)]);

  const livingWithVal = family?.living_with ? formatEnumText(family.living_with) : null;
  fields.push(["Living Preference", formatPrefItem(livingWithVal, family?.living_with_importance)]);

  const parentsStatusVal = family?.parents_status_preference
    ? formatEnumText(family.parents_status_preference)
    : null;
  fields.push(["Parents Status", formatPrefItem(parentsStatusVal, family?.parents_status_importance)]);

  // 7. Lifestyle & Habits
  const smokingRaw = lifestyle?.smoking;
  let smokingVal: string | null = null;
  if (smokingRaw === 'NO' || smokingRaw === 'NON_SMOKER') {
    smokingVal = 'Non-Smoker';
  } else if (smokingRaw === 'YES' || smokingRaw === 'SMOKER') {
    smokingVal = 'Smoker';
  } else if (smokingRaw === 'OCCASIONAL' || smokingRaw === 'OCCASIONALLY') {
    smokingVal = 'Occasionally';
  } else if (smokingRaw) {
    smokingVal = formatEnumText(smokingRaw);
  }
  fields.push(["Smoking", formatPrefItem(smokingVal, lifestyle?.smoking_importance)]);

  if (lifestyle?.additional_preferences && String(lifestyle.additional_preferences).trim()) {
    fields.push(["Additional Preferences", String(lifestyle.additional_preferences).trim()]);
  }

  // 8. Relocation
  const reloRaw = relocation?.willing_to_relocate_required;
  const reloVal = reloRaw === 'YES' ? 'Must be willing to relocate' : reloRaw === 'NO' ? 'No relocation required' : null;
  fields.push(["Relocation", formatPrefItem(reloVal, relocation?.relocation_importance)]);

  if (prefRelocations.length > 0) {
    const includedRelocs = prefRelocations
      .filter((l: any) => !l.is_excluded)
      .map((l: any) => formatLocationEntry(l, refStore))
      .filter(Boolean);
    const excludedRelocs = prefRelocations
      .filter((l: any) => l.is_excluded)
      .map((l: any) => formatLocationEntry(l, refStore))
      .filter(Boolean);

    if (includedRelocs.length > 0) {
      fields.push(["Relocation Target", formatPrefItem(includedRelocs.join(' • '), relocation?.relocation_importance)]);
    }
    if (excludedRelocs.length > 0) {
      fields.push(["Excluded Relocation", excludedRelocs.join(' • ')]);
    }
  } else {
    const reloCountry =
      relocation?.country_name_en ||
      (relocation?.country_id ? refStore.getCountryById(Number(relocation.country_id))?.name_en : null);
    const reloProvince =
      relocation?.province_name_en ||
      (relocation?.province_id ? refStore.getProvinceById(Number(relocation.province_id))?.name_en : null);
    const reloCity =
      relocation?.city_name_en ||
      (relocation?.city_id ? refStore.getCityById(Number(relocation.city_id))?.name_en : null);
    const reloLoc = [reloCountry, reloProvince, reloCity].filter(Boolean).join(', ');
    fields.push(["Relocation Target", formatPrefItem(reloLoc || null, relocation?.relocation_importance)]);
  }

  return fields;
}

export function getProfileGroups(item: RequestItem, preferences?: any, isLoadingPrefs?: boolean): ProfileGroup[] {
  const d = (item.profileData || {}) as any;
  if (!d) return [];

  const refStore = useReferenceDataStore.getState();

  const pi = d.personal_information || {};
  const phy = d.physical_information || {};
  const rel = d.religion_information || {};
  const loc = d.profile_locations || {};
  const res = d.residency_information || {};
  const inc = d.income_information || {};
  const fam = d.family_information || {};
  const life = d.lifestyle_information || {};
  const reloc = d.relocation_information || {};

  const eduList: any[] = Array.isArray(d.education_records) ? d.education_records : [];
  const empList: any[] = Array.isArray(d.employment_records) ? d.employment_records : [];
  const parentsList: any[] = Array.isArray(d.parents) ? d.parents : [];
  const siblingsList: any[] = Array.isArray(d.siblings) ? d.siblings : [];
  const childrenList: any[] = Array.isArray(d.children) ? d.children : [];
  const prevMarriagesList: any[] = Array.isArray(d.previous_marriages) ? d.previous_marriages : [];

  const gender =
    d.gender ||
    pi.gender ||
    (preferences?.basic?.preferred_gender === 'FEMALE'
      ? 'MALE'
      : preferences?.basic?.preferred_gender === 'MALE'
        ? 'FEMALE'
        : undefined);

  // ── 1. Basic Information ────────────────────────────────────────
  const fullName = d.full_name || pi.full_name || item.name || 'N/A';
  const phone = d.primary_phone || d.phone || pi.phone || item.phone || 'N/A';
  const cnic = d.cnic || pi.cnic || item.cnic || 'N/A';
  const dob = d.date_of_birth || pi.date_of_birth || '';
  const maritalStatus = d.marital_status || pi.marital_status || 'N/A';
  const numberOfChildren =
    d.number_of_children !== undefined && d.number_of_children !== null
      ? d.number_of_children
      : pi.number_of_children;
  const nationalityCountryId = d.nationality_country_id || pi.nationality_country_id;
  const nationalityName =
    d.nationality_country_name_en ||
    (nationalityCountryId ? refStore.getCountryById(Number(nationalityCountryId))?.name_en : null) ||
    'N/A';
  const multipleNationality = Boolean(pi.multiple_nationality ?? d.multiple_nationality);
  const motherTongueId = d.mother_tongue_id || pi.mother_tongue_id;
  const motherTongueName =
    d.mother_tongue_name_en ||
    (motherTongueId ? refStore.getMotherTongueById(Number(motherTongueId))?.name_en : null) ||
    'N/A';

  const basicFields: ProfileField[] = [
    ["Profile picture", "Include"],
    ["Full name", fullName],
    ...(gender ? [["Gender", formatEnumText(gender)] as ProfileField] : []),
    ["Phone", phone],
    ["CNIC", cnic],
    ["Age", formatAgeFromDob(dob)],
    ...(dob && /^\d{4}-\d{2}-\d{2}/.test(String(dob)) ? [["Date of Birth", String(dob).slice(0, 10)] as ProfileField] : []),
    ["Marital status", maritalStatus !== 'N/A' ? formatEnumText(maritalStatus) : 'N/A'],
    ["Nationality", nationalityName],
    ...(multipleNationality ? [["Dual Nationality", "Yes"] as ProfileField] : []),
    ["Mother tongue", motherTongueName],
  ];

  if (maritalStatus !== 'NEVER_MARRIED') {
    basicFields.push([
      "Children",
      numberOfChildren !== null && numberOfChildren !== undefined ? String(numberOfChildren) : 'N/A',
    ]);

    childrenList.forEach((ch: any, idx: number) => {
      const chGender = formatEnumText(ch.gender);
      const chAge = ch.age !== null && ch.age !== undefined && ch.age !== '' ? `${ch.age} yrs` : '';
      const chLiving =
        ch.living_with_profile === true || ch.living_with_profile === 'YES'
          ? 'Living Together'
          : ch.living_with_profile === false || ch.living_with_profile === 'NO'
            ? 'Living Separately'
            : '';
      const chDetails = ch.additional_details ? String(ch.additional_details).trim() : '';
      const summary = [chGender, chAge, chLiving, chDetails].filter(Boolean).join(' • ');
      if (summary) {
        basicFields.push([`Child #${idx + 1}`, summary]);
      }
    });

    prevMarriagesList.forEach((pm: any, idx: number) => {
      const pmStatus = formatEnumText(pm.marriage_status);
      const pmYears =
        pm.marriage_year || pm.end_year ? `${pm.marriage_year || '?'} – ${pm.end_year || '?'}` : '';
      const pmReason = pm.reason_for_end ? `Reason: ${String(pm.reason_for_end).trim()}` : '';
      const pmChildren =
        pm.children_count !== null && pm.children_count !== undefined && Number(pm.children_count) > 0
          ? `Children: ${pm.children_count}`
          : '';
      const pmLiving =
        Number(pm.children_count) > 0
          ? pm.children_live_with_profile === true || pm.children_live_with_profile === 'YES'
            ? 'Live Together'
            : pm.children_live_with_profile === false || pm.children_live_with_profile === 'NO'
              ? 'Live Separately'
              : ''
          : '';
      const pmDetails = pm.additional_details ? String(pm.additional_details).trim() : '';
      const summary = [pmStatus, pmYears, pmReason, pmChildren, pmLiving, pmDetails]
        .filter(Boolean)
        .join(' • ');
      if (summary) {
        basicFields.push([`Previous Marriage #${idx + 1}`, summary]);
      }
    });
  }

  // ── 2. Physical Attributes ──────────────────────────────────────
  const heightCm = d.height_cm ?? phy.height_cm;
  const weightKg = d.weight_kg ?? phy.weight_kg;
  const complexion = d.complexion || phy.complexion || 'N/A';
  const hasDisability = Boolean(d.has_disability ?? phy.has_disability);
  const disabilityDetails = d.disability_details || phy.disability_details;

  const physicalFields: ProfileField[] = [
    ["Height", heightCm ? `${heightCm} cm` : 'N/A'],
    ["Weight", weightKg ? `${weightKg} kg` : 'N/A'],
    ["Complexion", complexion !== 'N/A' ? formatEnumText(complexion) : 'N/A'],
    ["Disability", hasDisability ? (disabilityDetails ? `Yes - ${disabilityDetails}` : "Yes") : "No"],
  ];

  // ── 3. Education & Profession ───────────────────────────────────
  const primaryEdu = eduList.find((e) => e.is_highest_qualification) || eduList[0];
  const primaryEduLevelName =
    primaryEdu?.education_level_name_en ||
    (primaryEdu?.education_level_id
      ? refStore.getEducationLevelById(Number(primaryEdu.education_level_id))?.name_en
      : null) ||
    d.education_level_name_en ||
    null;
  const primaryQualification = primaryEdu?.qualification || d.qualification || null;
  const primaryFieldOfStudy = primaryEdu?.field_of_study || d.field_of_study || null;
  const primaryInstitution = primaryEdu?.institution_name || d.institution_name || null;
  const primaryEduYears =
    primaryEdu?.start_year || primaryEdu?.end_year
      ? `${primaryEdu.start_year || '?'} – ${primaryEdu.end_year || 'Present'}`
      : null;
  const primaryEduDetails = primaryEdu?.details ? String(primaryEdu.details).trim() : null;

  const primaryEmp = empList.find((e) => e.is_current) || empList[0];
  const primaryOccName =
    primaryEmp?.occupation_name_en ||
    (primaryEmp?.occupation_id
      ? refStore.getOccupationById(Number(primaryEmp.occupation_id))?.name_en
      : null) ||
    d.occupation_name_en ||
    null;
  const primaryJobTitle = primaryEmp?.job_title || d.job_title || null;
  const primaryOrgName = primaryEmp?.organization_name || d.organization_name || null;
  const primaryEmpType = primaryEmp?.employment_type ? formatEnumText(primaryEmp.employment_type) : null;
  const primaryEmpDetails = primaryEmp?.details ? String(primaryEmp.details).trim() : null;

  const minInc = d.monthly_income_min ?? inc.monthly_income_min;
  const maxInc = d.monthly_income_max ?? inc.monthly_income_max;
  let incomeStr = 'N/A';
  if (minInc != null && minInc !== '' && maxInc != null && maxInc !== '' && Number(maxInc) > Number(minInc)) {
    incomeStr = `Rs ${Number(minInc).toLocaleString()} - ${Number(maxInc).toLocaleString()}`;
  } else if (minInc != null && minInc !== '') {
    incomeStr = `Rs ${Number(minInc).toLocaleString()}`;
  } else if (maxInc != null && maxInc !== '') {
    incomeStr = `Up to Rs ${Number(maxInc).toLocaleString()}`;
  }

  const eduProfFields: ProfileField[] = [
    ["Education Level", primaryEduLevelName || primaryQualification || 'N/A'],
    ...(primaryQualification && primaryEduLevelName && primaryQualification.toLowerCase() !== primaryEduLevelName.toLowerCase()
      ? [["Qualification", primaryQualification] as ProfileField]
      : []),
    ["Field of Study", primaryFieldOfStudy || 'N/A'],
    ...(primaryInstitution ? [["Institution", primaryInstitution] as ProfileField] : []),
    ...(primaryEduYears ? [["Education Years", primaryEduYears] as ProfileField] : []),
    ...(primaryEduDetails ? [["Education Details", primaryEduDetails] as ProfileField] : []),
  ];

  if (eduList.length > 1) {
    eduList.forEach((edu: any, idx: number) => {
      const lvl =
        edu.education_level_name_en ||
        (edu.education_level_id ? refStore.getEducationLevelById(Number(edu.education_level_id))?.name_en : '');
      const yrs = edu.start_year || edu.end_year ? `${edu.start_year || '?'}–${edu.end_year || 'Present'}` : '';
      const summary = [lvl, edu.qualification, edu.field_of_study, edu.institution_name, yrs, edu.details]
        .filter(Boolean)
        .join(' • ');
      if (summary) {
        eduProfFields.push([`Education #${idx + 1}`, summary]);
      }
    });
  }

  if (primaryOccName) {
    eduProfFields.push(["Occupation", primaryOccName]);
  }
  if (primaryJobTitle || primaryOccName) {
    eduProfFields.push(["Job Title", (primaryJobTitle || primaryOccName)!]);
  }
  if (primaryOrgName) {
    eduProfFields.push(["Organization", primaryOrgName]);
  }
  if (primaryEmpType) {
    eduProfFields.push(["Employment Type", primaryEmpType]);
  }
  if (primaryEmpDetails) {
    eduProfFields.push(["Employment Details", primaryEmpDetails]);
  }

  if (empList.length > 1) {
    empList.forEach((emp: any, idx: number) => {
      const occ =
        emp.occupation_name_en ||
        (emp.occupation_id ? refStore.getOccupationById(Number(emp.occupation_id))?.name_en : '');
      const empT = emp.employment_type ? formatEnumText(emp.employment_type) : '';
      const statusTag = emp.is_current ? 'Current' : 'Past';
      const summary = [emp.job_title, occ, emp.organization_name, empT, statusTag, emp.details]
        .filter(Boolean)
        .join(' • ');
      if (summary) {
        eduProfFields.push([`Employment #${idx + 1}`, summary]);
      }
    });
  }

  if (incomeStr !== 'N/A') {
    eduProfFields.push(["Income", incomeStr]);
  }

  // ── 4. Religion & Culture ───────────────────────────────────────
  const religionId = d.religion_id || rel.religion_id;
  const religionName =
    d.religion_name_en ||
    (religionId ? refStore.getReligionById(Number(religionId))?.name_en : null) ||
    'Islam';
  const sectId = d.sect_id || rel.sect_id;
  const sectName =
    d.sect_name_en ||
    (sectId ? refStore.getSectById(Number(sectId))?.name_en : null) ||
    'N/A';
  const casteId = d.caste_id || rel.caste_id;
  const casteName =
    d.caste_name_en ||
    (casteId ? refStore.getCasteById(Number(casteId))?.name_en : null) ||
    null;
  const otherCasteText = (d.other_caste_text || rel.other_caste_text || '').trim() || null;

  const religionFields: ProfileField[] = [
    ["Religion", religionName],
    ["Sect", sectName],
    ["Caste", casteName || otherCasteText || 'N/A'],
    ...(casteName && otherCasteText ? [["Other Caste", otherCasteText] as ProfileField] : []),
    ["Mother tongue", motherTongueName],
  ];

  // ── 5. Location & Residency ─────────────────────────────────────
  const currCountryId = d.current_country_id || loc.current_country_id;
  const currCountryName =
    d.current_country_name_en ||
    d.current_country ||
    (currCountryId ? refStore.getCountryById(Number(currCountryId))?.name_en : null) ||
    null;
  const currProvinceId = d.current_province_id || loc.current_province_id;
  const currProvinceName =
    d.current_province_name_en ||
    (currProvinceId ? refStore.getProvinceById(Number(currProvinceId))?.name_en : null) ||
    null;
  const currCityId = d.current_city_id || loc.current_city_id;
  const currCityName =
    d.current_city_name_en ||
    (currCityId ? refStore.getCityById(Number(currCityId))?.name_en : null) ||
    null;
  const currLocationText = (d.current_location_text || loc.current_location_text || '').trim() || null;

  const permCountryId = d.permanent_country_id || loc.permanent_country_id;
  const permCountryName =
    d.permanent_country_name_en ||
    (permCountryId ? refStore.getCountryById(Number(permCountryId))?.name_en : null) ||
    null;
  const permProvinceId = d.permanent_province_id || loc.permanent_province_id;
  const permProvinceName =
    d.permanent_province_name_en ||
    (permProvinceId ? refStore.getProvinceById(Number(permProvinceId))?.name_en : null) ||
    null;
  const permCityId = d.permanent_city_id || loc.permanent_city_id;
  const permCityName =
    d.permanent_city_name_en ||
    (permCityId ? refStore.getCityById(Number(permCityId))?.name_en : null) ||
    null;
  const permLocationText = (d.permanent_location_text || loc.permanent_location_text || '').trim() || null;

  const houseStatus = d.house_status || res.house_status || null;
  const propertyType = d.property_type || res.property_type || null;
  const familySetup = d.family_setup || res.family_setup || null;
  const livingWith = d.living_with || res.living_with || null;
  const livingWithOther = (d.living_with_other_details || res.living_with_other_details || '').trim() || null;

  const locationFields: ProfileField[] = [
    ...(currCountryName ? [["Current country", currCountryName] as ProfileField] : []),
    ...(currProvinceName ? [["Current province", currProvinceName] as ProfileField] : []),
    ["Current city", currCityName || currLocationText || 'N/A'],
    ...(currCityName && currLocationText && currLocationText.toLowerCase() !== currCityName.toLowerCase()
      ? [["Current address", currLocationText] as ProfileField]
      : []),
    ...(permCountryName ? [["Permanent country", permCountryName] as ProfileField] : []),
    ...(permProvinceName ? [["Permanent province", permProvinceName] as ProfileField] : []),
    ...(permCityName || permLocationText
      ? [["Permanent city", (permCityName || permLocationText)!] as ProfileField]
      : []),
    ...(permCityName && permLocationText && permLocationText.toLowerCase() !== permCityName.toLowerCase()
      ? [["Permanent address", permLocationText] as ProfileField]
      : []),
    ...(houseStatus ? [["House status", formatEnumText(houseStatus)] as ProfileField] : []),
    ...(propertyType ? [["Property type", formatEnumText(propertyType)] as ProfileField] : []),
    ...(familySetup ? [["Family Setup", formatEnumText(familySetup)] as ProfileField] : []),
    ...(livingWith
      ? [[
          "Living With",
          livingWith === 'OTHER' && livingWithOther
            ? `Other - ${livingWithOther}`
            : formatEnumText(livingWith),
        ] as ProfileField]
      : []),
  ];

  // ── 6. Family Details ───────────────────────────────────────────
  const familyFields: ProfileField[] = [];

  const father = parentsList.find((p: any) => p.parent_type === 'FATHER');
  if (father) {
    if (father.full_name) familyFields.push(["Father Name", father.full_name]);
    const fStatus = [formatEnumText(father.status), father.age ? `${father.age} yrs` : ''].filter(Boolean).join(', ');
    if (fStatus) familyFields.push(["Father Status", fStatus]);
    if (father.profession) familyFields.push(["Father Profession", father.profession]);
    if (father.education) familyFields.push(["Father Education", father.education]);
    const fCity = father.city_name_en || (father.city_id ? refStore.getCityById(Number(father.city_id))?.name_en : '');
    const fCountry = father.country_name_en || (father.country_id ? refStore.getCountryById(Number(father.country_id))?.name_en : '');
    const fLoc = [fCity, fCountry].filter(Boolean).join(', ');
    if (fLoc) familyFields.push(["Father Location", fLoc]);
    const fNotes = [father.living_arrangement, father.social_background, father.additional_details]
      .map((s) => (s ? String(s).trim() : ''))
      .filter(Boolean)
      .join(' • ');
    if (fNotes) familyFields.push(["Father Details", fNotes]);
  }

  const mother = parentsList.find((p: any) => p.parent_type === 'MOTHER');
  if (mother) {
    if (mother.full_name) familyFields.push(["Mother Name", mother.full_name]);
    const mStatus = [formatEnumText(mother.status), mother.age ? `${mother.age} yrs` : ''].filter(Boolean).join(', ');
    if (mStatus) familyFields.push(["Mother Status", mStatus]);
    if (mother.profession) familyFields.push(["Mother Profession", mother.profession]);
    if (mother.education) familyFields.push(["Mother Education", mother.education]);
    const mCity = mother.city_name_en || (mother.city_id ? refStore.getCityById(Number(mother.city_id))?.name_en : '');
    const mCountry = mother.country_name_en || (mother.country_id ? refStore.getCountryById(Number(mother.country_id))?.name_en : '');
    const mLoc = [mCity, mCountry].filter(Boolean).join(', ');
    if (mLoc) familyFields.push(["Mother Location", mLoc]);
    const mNotes = [mother.living_arrangement, mother.social_background, mother.additional_details]
      .map((s) => (s ? String(s).trim() : ''))
      .filter(Boolean)
      .join(' • ');
    if (mNotes) familyFields.push(["Mother Details", mNotes]);
  }

  if (siblingsList.length > 0) {
    const brothers = siblingsList.filter((s: any) => s.gender === 'MALE').length;
    const sisters = siblingsList.filter((s: any) => s.gender === 'FEMALE').length;
    const countParts: string[] = [];
    if (brothers > 0) countParts.push(`${brothers} Brother${brothers > 1 ? 's' : ''}`);
    if (sisters > 0) countParts.push(`${sisters} Sister${sisters > 1 ? 's' : ''}`);
    familyFields.push([
      "Siblings Count",
      countParts.length > 0 ? `${countParts.join(', ')} (Total: ${siblingsList.length})` : String(siblingsList.length),
    ]);

    let broIdx = 0;
    let sisIdx = 0;
    siblingsList.forEach((sib: any, idx: number) => {
      const isBro = sib.gender === 'MALE';
      const isSis = sib.gender === 'FEMALE';
      const label = isBro ? `Brother #${++broIdx}` : isSis ? `Sister #${++sisIdx}` : `Sibling #${idx + 1}`;
      const sCity = sib.city_name_en || (sib.city_id ? refStore.getCityById(Number(sib.city_id))?.name_en : '');
      const sCountry = sib.country_name_en || (sib.country_id ? refStore.getCountryById(Number(sib.country_id))?.name_en : '');
      const sLoc = [sCity, sCountry].filter(Boolean).join(', ');
      const summary = [
        sib.full_name,
        sib.age ? `${sib.age} yrs` : '',
        formatEnumText(sib.marital_status),
        sib.profession,
        sib.education,
        sLoc,
      ]
        .filter(Boolean)
        .join(' • ');
      if (summary) {
        familyFields.push([label, summary]);
      }
    });
  }

  const famProf = (d.family_profession_business || fam.family_profession_business || '').trim() || null;
  const famSocial = (d.social_background || fam.social_background || '').trim() || null;
  const famValues = (d.family_values || fam.family_values || '').trim() || null;
  const famIntro = (d.family_introduction || fam.family_introduction || '').trim() || null;
  const famCircumstances = (d.important_family_circumstances || fam.important_family_circumstances || '').trim() || null;
  const famAddDetails = (d.family_additional_details || fam.additional_details || '').trim() || null;

  if (famProf) familyFields.push(["Family Profession", famProf]);
  if (famSocial) familyFields.push(["Social Background", famSocial]);
  if (famValues) familyFields.push(["Family Values", famValues]);
  if (famIntro) familyFields.push(["Family Introduction", famIntro]);
  if (famCircumstances) familyFields.push(["Family Circumstances", famCircumstances]);
  if (famAddDetails) familyFields.push(["Additional Family Info", famAddDetails]);
  if (familyFields.length === 0) {
    if (familySetup) familyFields.push(["Family Setup", formatEnumText(familySetup)]);
    if (livingWith) {
      familyFields.push([
        "Living With",
        livingWith === 'OTHER' && livingWithOther ? `Other - ${livingWithOther}` : formatEnumText(livingWith),
      ]);
    }
  }

  // ── 7. Lifestyle & Relocation ───────────────────────────────────
  const religiousPractice = d.religious_practice || life.religious_practice || 'N/A';
  const beard = d.beard || life.beard || 'N/A';
  const hijab = d.hijab || life.hijab || 'N/A';
  const smoking = d.smoking || life.smoking || 'N/A';
  const otherLifestyle = (d.other_lifestyle_information || life.other_lifestyle_information || '').trim() || null;

  const willingToRelocate = d.willing_to_relocate || reloc.willing_to_relocate || null;
  const relocCountryId = d.preferred_country_id || reloc.preferred_country_id;
  const relocCountryName = relocCountryId ? refStore.getCountryById(Number(relocCountryId))?.name_en : null;
  const relocProvinceId = d.preferred_province_id || reloc.preferred_province_id;
  const relocProvinceName = relocProvinceId ? refStore.getProvinceById(Number(relocProvinceId))?.name_en : null;
  const relocCityId = d.preferred_city_id || reloc.preferred_city_id;
  const relocCityName = relocCityId ? refStore.getCityById(Number(relocCityId))?.name_en : null;
  const relocDetails = (d.relocation_details || reloc.relocation_details || '').trim() || null;

  const lifestyleFields: ProfileField[] = [
    ["Prayer", religiousPractice !== 'N/A' ? formatEnumText(religiousPractice) : 'N/A'],
    ...(gender !== 'FEMALE' && beard !== 'N/A' ? [["Beard", formatEnumText(beard)] as ProfileField] : []),
    ...(gender !== 'MALE' && hijab !== 'N/A' ? [["Hijab", formatEnumText(hijab)] as ProfileField] : []),
    ["Smoking", smoking !== 'N/A' ? formatEnumText(smoking) : 'N/A'],
    ...(otherLifestyle ? [["Lifestyle Notes", otherLifestyle] as ProfileField] : []),
    ...(willingToRelocate ? [["Willing to Relocate", formatEnumText(willingToRelocate)] as ProfileField] : []),
    ...(relocCountryName ? [["Relocation Country", relocCountryName] as ProfileField] : []),
    ...(relocProvinceName ? [["Relocation Province", relocProvinceName] as ProfileField] : []),
    ...(relocCityName ? [["Relocation City", relocCityName] as ProfileField] : []),
    ...(relocDetails ? [["Relocation Details", relocDetails] as ProfileField] : []),
  ];

  return [
    ["Basic Information", basicFields],
    ["Physical Attributes", physicalFields],
    ["Education & Profession", eduProfFields],
    ["Religion & Culture", religionFields],
    ["Location & Residency", locationFields],
    ["Family Details", familyFields],
    ["Lifestyle", lifestyleFields],
    ["Partner Preferences", formatPartnerPreferences(preferences, isLoadingPrefs, gender)],
  ];
}

