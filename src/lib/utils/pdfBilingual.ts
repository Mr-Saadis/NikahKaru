import { useReferenceDataStore } from '@/lib/stores/reference-data-store';

export interface BilingualText {
  en: string;
  ur: string;
}

const SECTION_BILINGUAL_MAP: Record<string, BilingualText> = {
  'basic information': { en: 'Basic & Personal Details', ur: 'ذاتی اور بنیادی معلومات' },
  'physical attributes': { en: 'Physical Attributes', ur: 'جسمانی خدوخال' },
  'education & profession': { en: 'Education & Career', ur: 'تعلیم اور پیشہ' },
  'religion & culture': { en: 'Religion & Heritage', ur: 'مذہب اور ثقافت' },
  'location & residency': { en: 'Location & Residency', ur: 'رہائش اور مقام' },
  'family details': { en: 'Family Background', ur: 'خاندانی تفصیلات' },
  'lifestyle': { en: 'Lifestyle & Practice', ur: 'طرزِ زندگی اور دینی رجحان' },
  'partner preferences': { en: 'Partner Preferences', ur: 'شریکِ حیات کی ترجیحات' },
  'approved match candidates': { en: 'Approved Match Candidates', ur: 'منظور شدہ رشتوں کی تفصیلات' },
};

const FIELD_LABEL_BILINGUAL_MAP: Record<string, BilingualText> = {
  // Core & Basic
  full_name: { en: 'Full Name', ur: 'پورا نام' },
  'full name': { en: 'Full Name', ur: 'پورا نام' },
  gender: { en: 'Gender', ur: 'جنس' },
  phone: { en: 'Contact Number', ur: 'فون نمبر' },
  primary_phone: { en: 'Contact Number', ur: 'فون نمبر' },
  cnic: { en: 'CNIC No.', ur: 'شناختی کارڈ نمبر' },
  date_of_birth: { en: 'Date of Birth', ur: 'تاریخِ پیدائش' },
  dob: { en: 'Date of Birth', ur: 'تاریخِ پیدائش' },
  marital_status: { en: 'Marital Status', ur: 'ازدواجی حیثیت' },
  'marital status': { en: 'Marital Status', ur: 'ازدواجی حیثیت' },
  number_of_children: { en: 'Children', ur: 'بچوں کی تعداد' },
  children: { en: 'Children', ur: 'بچے' },
  'children allowed': { en: 'Children Allowed', ur: 'بچوں کی اجازت' },
  nationality: { en: 'Nationality', ur: 'قومیت' },
  nationality_country_id: { en: 'Nationality', ur: 'قومیت' },
  mother_tongue: { en: 'Mother Tongue', ur: 'مادری زبان' },
  'mother tongue': { en: 'Mother Tongue', ur: 'مادری زبان' },
  mother_tongue_id: { en: 'Mother Tongue', ur: 'مادری زبان' },

  // Physical
  height: { en: 'Height', ur: 'قد' },
  height_cm: { en: 'Height', ur: 'قد' },
  'desired height': { en: 'Desired Height', ur: 'مطلوبہ قد' },
  weight: { en: 'Weight', ur: 'وزن' },
  weight_kg: { en: 'Weight', ur: 'وزن' },
  'desired weight': { en: 'Desired Weight', ur: 'مطلوبہ وزن' },
  complexion: { en: 'Complexion', ur: 'رنگت' },
  disability: { en: 'Disability', ur: 'معذوری' },
  has_disability: { en: 'Disability Status', ur: 'معذوری کی کیفیت' },
  disability_details: { en: 'Disability Details', ur: 'معذوری کی تفصیل' },
  'disability allowed': { en: 'Disability Allowed', ur: 'معذوری قابلِ قبول' },

  // Education & Profession
  'education level': { en: 'Education Level', ur: 'تعلیمی قابلیت' },
  education_level_id: { en: 'Education Level', ur: 'تعلیمی قابلیت' },
  'min education': { en: 'Minimum Education', ur: 'کم از کم تعلیم' },
  qualification: { en: 'Qualification', ur: 'ڈگری / قابلیت' },
  education: { en: 'Education', ur: 'تعلیم' },
  education_records: { en: 'Education', ur: 'تعلیم' },
  'field of study': { en: 'Field of Study', ur: 'شعبۂ تعلیم' },
  field_of_study: { en: 'Field of Study', ur: 'شعبۂ تعلیم' },
  'job title': { en: 'Profession / Designation', ur: 'پیشہ / عہدہ' },
  job_title: { en: 'Profession / Designation', ur: 'پیشہ / عہدہ' },
  occupation_id: { en: 'Occupation', ur: 'پیشہ' },
  'preferred profession': { en: 'Preferred Profession', ur: 'پسندیدہ پیشہ' },
  employment: { en: 'Employment', ur: 'ملازمت / روزگار' },
  employment_records: { en: 'Employment', ur: 'ملازمت / روزگار' },
  'employment type': { en: 'Employment Type', ur: 'ملازمت کی نوعیت' },
  income: { en: 'Monthly Income', ur: 'ماہانہ آمدنی' },
  'monthly income': { en: 'Monthly Income', ur: 'ماہانہ آمدنی' },
  monthly_income_min: { en: 'Monthly Income', ur: 'ماہانہ آمدنی' },

  // Religion & Culture
  religion: { en: 'Religion', ur: 'مذہب' },
  religion_id: { en: 'Religion', ur: 'مذہب' },
  sect: { en: 'Sect / Maslak', ur: 'مسلک / فرقہ' },
  sect_id: { en: 'Sect / Maslak', ur: 'مسلک / فرقہ' },
  caste: { en: 'Caste / Biradari', ur: 'ذات / برادری' },
  caste_id: { en: 'Caste / Biradari', ur: 'ذات / برادری' },

  // Location & Residency
  'current country': { en: 'Current Country', ur: 'موجودہ ملک' },
  current_country_id: { en: 'Current Country', ur: 'موجودہ ملک' },
  'current province': { en: 'Current Province', ur: 'موجودہ صوبہ' },
  'current city': { en: 'Current City', ur: 'موجودہ شہر' },
  current_city_id: { en: 'Current City', ur: 'موجودہ شہر' },
  'permanent city': { en: 'Permanent City', ur: 'مستقل شہر' },
  permanent_city_id: { en: 'Permanent City', ur: 'مستقل شہر' },
  city: { en: 'City', ur: 'شہر' },
  city_id: { en: 'City', ur: 'شہر' },
  country: { en: 'Country', ur: 'ملک' },
  country_id: { en: 'Country', ur: 'ملک' },
  'preferred country': { en: 'Preferred Country', ur: 'پسندیدہ ملک' },
  'preferred province': { en: 'Preferred Province', ur: 'پسندیدہ صوبہ' },
  'preferred city': { en: 'Preferred City', ur: 'پسندیدہ شہر' },
  residency: { en: 'Nationality / Residency', ur: 'شہریت / رہائش' },
  'house status': { en: 'House Status', ur: 'رہائش کی ملکیت' },
  house_status: { en: 'House Status', ur: 'رہائش کی ملکیت' },

  // Family
  profession: { en: 'Family Business / Profession', ur: 'خاندانی کاروبار / پیشہ' },
  family_profession_business: { en: 'Family Profession', ur: 'خاندانی پیشہ' },
  'family profession': { en: 'Family Profession', ur: 'خاندانی پیشہ' },
  'social background': { en: 'Social Background', ur: 'سماجی حیثیت' },
  social_background: { en: 'Social Background', ur: 'سماجی حیثیت' },
  'family setup': { en: 'Family Setup', ur: 'خاندانی نظام' },
  family_setup: { en: 'Family Setup', ur: 'خاندانی نظام' },
  'living with': { en: 'Living Arrangement', ur: 'رہائشی انتظام' },
  living_with: { en: 'Living Arrangement', ur: 'رہائشی انتظام' },
  'living preference': { en: 'Living Preference', ur: 'رہائش کی ترجیح' },
  'parents status': { en: 'Parents Status', ur: 'والدین کی کیفیت' },

  // Lifestyle
  prayer: { en: 'Religious Practice', ur: 'دینی رجحان / نماز' },
  'religious practice': { en: 'Religious Practice', ur: 'دینی رجحان' },
  religious_practice: { en: 'Religious Practice', ur: 'دینی رجحان' },
  beard: { en: 'Beard', ur: 'داڑھی' },
  'beard preference': { en: 'Beard Preference', ur: 'داڑھی کی ترجیح' },
  hijab: { en: 'Hijab / Purdah', ur: 'حجاب / پردہ' },
  'hijab preference': { en: 'Hijab Preference', ur: 'حجاب کی ترجیح' },
  smoking: { en: 'Smoking Habit', ur: 'سگریٹ نوشی' },

  // Other Preferences
  'desired age': { en: 'Desired Age', ur: 'مطلوبہ عمر' },
  relocation: { en: 'Relocation', ur: 'نقل مکانی' },
  'relocation target': { en: 'Relocation Destination', ur: 'نقل مکانی کا مقام' },
  preferences: { en: 'Preferences', ur: 'ترجیحات' },
  status: { en: 'Status', ur: 'حیثیت' },
};

const VALUE_DICTIONARY: Record<string, string> = {
  // Booleans & common
  yes: 'جی ہاں',
  no: 'نہیں',
  none: 'کوئی نہیں',
  include: 'شامل ہے',
  included: 'شامل ہے',
  "doesn't matter": 'کوئی خاص قید نہیں',
  doesnt_matter: 'کوئی خاص قید نہیں',
  does_not_matter: 'کوئی خاص قید نہیں',
  any: 'کوئی بھی',

  // Gender
  male: 'مرد',
  female: 'خاتون',

  // Marital status
  never_married: 'غیر شادی شدہ',
  'never married': 'غیر شادی شدہ',
  married: 'شادی شدہ',
  divorced: 'طلاق یافتہ',
  widowed: 'بیوہ / رنڈوا',
  separated: 'علیحدگی',

  // House status & family setup & living
  own: 'ذاتی مکان',
  'own house': 'ذاتی مکان',
  rented: 'کرائے کا مکان',
  family_house: 'خاندانی مکان',
  'family house': 'خاندانی مکان',
  joint: 'مشترکہ خاندانی نظام',
  separate: 'الگ فیملی نظام',
  parents: 'والدین کے ساتھ',
  father: 'والد کے ساتھ',
  mother: 'والدہ کے ساتھ',
  siblings: 'بہن بھائیوں کے ساتھ',
  alone: 'اکیلے',
  both_alive: 'دونوں حیات ہیں',
  'both alive': 'دونوں حیات ہیں',
  father_deceased: 'والد وفات پا چکے ہیں',
  mother_deceased: 'والدہ وفات پا چکی ہیں',
  both_deceased: 'دونوں وفات پا چکے ہیں',
  other: 'دیگر',

  // Lifestyle / Religious practice
  highly_practicing: 'مکمل باعمل / پابندِ صوم و صلوٰۃ',
  'highly practicing': 'مکمل باعمل / پابندِ صوم و صلوٰۃ',
  practicing: 'باعمل / نمازی',
  moderate: 'معتدل',
  non_smoker: 'سگریٹ نوشی نہیں',
  'non-smoker': 'سگریٹ نوشی نہیں',
  smoker: 'سگریٹ نوشی کرتے ہیں',
  occasionally: 'کبھی کبھار',
  'occasional smoker': 'کبھی کبھار سگریٹ نوشی',

  // Employment types
  government: 'سرکاری ملازمت',
  private: 'پرائیویٹ ملازمت',
  business: 'ذاتی کاروبار',
  self_employed: 'خود روزگار',
  'self-employed': 'خود روزگار',
  'self employed': 'خود روزگار',
  freelancer: 'فری لانسر',
  student: 'طالب علم',
  unemployed: 'بے روزگار',
  housewife: 'خاتونِ خانہ',
  homemaker: 'خاتونِ خانہ',

  // Complexion
  'very fair': 'نہایت گورا',
  very_fair: 'نہایت گورا',
  fair: 'گورا',
  wheatish: 'گندمی',
  medium: 'درمیانی رنگت',
  olive: 'سانولا / گندمی',
  dark: 'سانولا',

  // Relocation
  'must be willing to relocate': 'نقل مکانی کے لیے آمادہ ہونا ضروری ہے',
  'no relocation required': 'نقل مکانی کی ضرورت نہیں',

  // Status
  new: 'نئی پروفائل',
  draft: 'مسودہ',
  active: 'فعال',
  paused: 'موقوف',
  inactive: 'غیر فعال',
  archived: 'محفوظ شدہ',
  pending: 'زیرِ التواء',
  in_review: 'جائزہ مکمل',
  completed: 'مکمل',
  downloaded: 'ڈاؤن لوڈ شدہ',

  // Religions, Sects, Castes, Languages (fallback if store hasn't loaded name_ur)
  islam: 'اسلام',
  sunni: 'سنی',
  shia: 'شیعہ',
  'ahle hadith': 'اہلِ حدیث',
  'ahl-e-hadith': 'اہلِ حدیث',
  'ahle-hadith': 'اہلِ حدیث',
  'ahl e hadith': 'اہلِ حدیث',
  deobandi: 'دیوبندی',
  barelvi: 'بریلوی',
  christianity: 'عیسائیت',
  christian: 'عیسائی',
  hinduism: 'ہندو مت',
  sikhism: 'سکھ مت',
  urdu: 'اردو',
  punjabi: 'پنجابی',
  pashto: 'پشتو',
  pushto: 'پشتو',
  sindhi: 'سندھی',
  saraiki: 'سرائیکی',
  balochi: 'بلوچی',
  hindko: 'ہندکو',
  kashmiri: 'کشمیری',
  english: 'انگریزی',
  arabic: 'عربی',
  arain: 'آرائیں',
  rajput: 'راجپوت',
  jutt: 'جٹ',
  jat: 'جٹ',
  sheikh: 'شیخ',
  syed: 'سید',
  mughal: 'مغل',
  malik: 'ملک',
  awan: 'اعوان',
  butt: 'بٹ',
  qureshi: 'قریشی',
  pathan: 'پٹھان',
  abbasi: 'عباسی',
  chaudhry: 'چوہدری',
  gujjar: 'گجر',
  khan: 'خان',
  ansari: 'انصاری',
  memon: 'میمن',
  khokhar: 'کھوکھر',
  bhatti: 'بھٹی',
  rana: 'رانا',
  mirza: 'مرزا',
  dar: 'ڈار',
  kashmiri_caste: 'کشمیری',

  // Common Countries & Cities
  pakistan: 'پاکستان',
  'saudi arabia': 'سعودی عرب',
  'united arab emirates': 'متحدہ عرب امارات',
  uae: 'متحدہ عرب امارات',
  'united kingdom': 'برطانیہ',
  uk: 'برطانیہ',
  'united states': 'امریکہ',
  usa: 'امریکہ',
  canada: 'کینیڈا',
  australia: 'آسٹریلیا',
  germany: 'جرمنی',
  lahore: 'لاہور',
  karachi: 'کراچی',
  islamabad: 'اسلام آباد',
  rawalpindi: 'راولپنڈی',
  faisalabad: 'فیصل آباد',
  multan: 'ملتان',
  peshawar: 'پشاور',
  quetta: 'کوئٹہ',
  sialkot: 'سیالکوٹ',
  gujranwala: 'گوجرانوالہ',
  gujrat: 'گجرات',
  bahawalpur: 'بہاولپور',
  sargodha: 'سرگودھا',
  hyderabad: 'حیدرآباد',
  abbottabad: 'ایبٹ آباد',
  mardan: 'مردان',
  sahiwal: 'ساہیوال',
  sheikhupura: 'شیخوپورہ',
  jhelum: 'جہلم',
  chakwal: 'چکوال',
  wah: 'واہ کینٹ',
  'wah cantt': 'واہ کینٹ',
  punjab: 'پنجاب',
  sindh: 'سندھ',
  'khyber pakhtunkhwa': 'خیبر پختونخوا',
  kpk: 'خیبر پختونخوا',
  balochistan: 'بلوچستان',
  'azad kashmir': 'آزاد کشمیر',
  gilgit: 'گلگت بلتستان',

  // Common Education & Professions & Social Background
  matric: 'میٹرک',
  matriculation: 'میٹرک',
  intermediate: 'انٹرمیڈیٹ',
  bachelors: 'بیچلرز / گریجویشن',
  "bachelor's": 'بیچلرز / گریجویشن',
  "bachelor's (4-year: bs, bba, be)": 'بیچلرز (4 سالہ ڈگری)',
  "bachelor's (2-year: ba, bsc, bcom)": 'بیچلرز (2 سالہ ڈگری)',
  masters: 'ماسٹرز',
  "master's": 'ماسٹرز',
  "master's (2-year: ms, ma, msc, mba)": 'ماسٹرز (2 سالہ ڈگری)',
  mphil: 'ایم فل',
  'm.phil': 'ایم فل',
  phd: 'پی ایچ ڈی',
  doctor: 'ڈاکٹر',
  mbbs: 'ایم بی بی ایس / ڈاکٹر',
  engineer: 'انجینئر',
  'software engineer': 'سافٹ ویئر انجینئر',
  teacher: 'استاد / معلم',
  'school teacher': 'اسکول ٹیچر',
  lecturer: 'لیکچرر',
  professor: 'پروفیسر',
  banker: 'بینکر',
  accountant: 'اکاؤنٹنٹ',
  chartered_accountant: 'چارٹرڈ اکاؤنٹنٹ',
  lawyer: 'وکیل',
  advocate: 'ایڈووکیٹ',
  businessman: 'کاروباری شخصیت',
  'civil servant': 'سرکاری افسر',
  'army officer': 'فوجی افسر',
  'arabic language': 'عربی زبان',
  'islamic studies': 'اسلامیات',
  'computer science': 'کمپیوٹر سائنس',
  'software engineering': 'سافٹ ویئر انجینئرنگ',
  'business administration': 'بزنس ایڈمنسٹریشن',
  'information technology': 'انفارمیشن ٹیکنالوجی',
  medicine: 'طب / میڈیسن',
  engineering: 'انجینئرنگ',
  commerce: 'کامرس',
  arts: 'آرٹس',
  'upper middle class': 'اپر مڈل کلاس',
  'middle class': 'متوسط طبقہ (مڈل کلاس)',
  'upper class': 'اعلیٰ طبقہ',
  'well settled': 'خوشحال اور مستحکم',
  religious: 'دیندار گھرانہ',
  'no specific partner preferences recorded': 'کوئی مخصوص ترجیحات درج نہیں ہیں',
};

const IMPORTANCE_URDU_MAP: Record<string, string> = {
  'must have': 'لازمی',
  mandatory: 'لازمی',
  high: 'اہم',
  medium: 'مناسب',
  low: 'کم اہم',
  "doesn't matter": 'کوئی قید نہیں',
};

const URDU_MONTHS = [
  'جنوری',
  'فروری',
  'مارچ',
  'اپریل',
  'مئی',
  'جون',
  'جولائی',
  'اگست',
  'ستمبر',
  'اکتوبر',
  'نومبر',
  'دسمبر',
];

const EN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function getBilingualSectionTitle(title: string): BilingualText {
  const key = title.trim().toLowerCase();
  if (SECTION_BILINGUAL_MAP[key]) {
    return SECTION_BILINGUAL_MAP[key];
  }
  return { en: title, ur: '' };
}

export function getBilingualFieldLabel(labelOrPath: string): BilingualText {
  const trimmed = (labelOrPath || '').trim();
  const lastPart = (trimmed.split('.').pop() || trimmed).toLowerCase();
  const normalized = trimmed.toLowerCase();

  if (FIELD_LABEL_BILINGUAL_MAP[normalized]) {
    return FIELD_LABEL_BILINGUAL_MAP[normalized];
  }
  if (FIELD_LABEL_BILINGUAL_MAP[lastPart]) {
    return FIELD_LABEL_BILINGUAL_MAP[lastPart];
  }

  const prettyEn = (trimmed.includes('.') ? lastPart : trimmed)
    .replace(/_id$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return { en: prettyEn || 'Field', ur: '' };
}

function lookupReferenceStoreUr(englishOrId: string | number): { en: string; ur: string } | null {
  const store = useReferenceDataStore.getState();
  const allLists = [
    store.countries,
    store.provinces,
    store.cities,
    store.religions,
    store.sects,
    store.castes,
    store.motherTongues,
    store.educationLevels,
    store.occupations,
  ];

  if (typeof englishOrId === 'number' || /^\d+$/.test(String(englishOrId).trim())) {
    const numId = Number(englishOrId);
    for (const list of allLists) {
      const found = list?.find((item: any) => item.id === numId);
      if (found) {
        return {
          en: found.name_en,
          ur: found.name_ur || VALUE_DICTIONARY[found.name_en?.toLowerCase()] || '',
        };
      }
    }
    return null;
  }

  const needle = String(englishOrId).trim().toLowerCase();
  for (const list of allLists) {
    const found = list?.find((item: any) => item.name_en?.trim().toLowerCase() === needle);
    if (found) {
      return {
        en: found.name_en,
        ur: found.name_ur || VALUE_DICTIONARY[needle] || '',
      };
    }
  }

  return null;
}

function cmToFeetInches(cm: number): { ft: number; inches: number } {
  const totalInches = Math.round(cm / 2.54);
  return {
    ft: Math.floor(totalInches / 12),
    inches: totalInches % 12,
  };
}

function translateSingleToken(token: string): BilingualText {
  const clean = token.trim();
  if (!clean) return { en: '', ur: '' };

  const lower = clean.toLowerCase();
  const underscored = lower.replace(/\s+/g, '_');

  // 1. Direct dictionary hit
  if (VALUE_DICTIONARY[lower]) {
    return {
      en: formatPrettyEnglish(clean),
      ur: VALUE_DICTIONARY[lower],
    };
  }
  if (VALUE_DICTIONARY[underscored]) {
    return {
      en: formatPrettyEnglish(clean),
      ur: VALUE_DICTIONARY[underscored],
    };
  }

  // 2. Reference store lookup (name_en -> name_ur)
  const refMatch = lookupReferenceStoreUr(clean);
  if (refMatch) {
    return refMatch;
  }

  // 3. Date string (ISO or slash format)
  if (/^\d{4}-\d{2}-\d{2}/.test(clean) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      const day = parsed.getDate();
      const monthIdx = parsed.getMonth();
      const year = parsed.getFullYear();
      return {
        en: `${String(day).padStart(2, '0')} ${EN_MONTHS[monthIdx]} ${year}`,
        ur: `${day} ${URDU_MONTHS[monthIdx]} ${year}`,
      };
    }
  }

  // 4. "Yes - details" pattern (e.g., disability details)
  if (/^yes\s*-\s*(.+)$/i.test(clean)) {
    const detail = clean.replace(/^yes\s*-\s*/i, '').trim();
    return {
      en: `Yes — ${detail}`,
      ur: `جی ہاں (${detail})`,
    };
  }

  // 5. Height single value ("168 cm")
  const singleCmMatch = clean.match(/^(\d+(?:\.\d+)?)\s*cm$/i);
  if (singleCmMatch) {
    const cm = Math.round(Number(singleCmMatch[1]));
    const { ft, inches } = cmToFeetInches(cm);
    return {
      en: `${ft}'${inches}" (${cm} cm)`,
      ur: `${ft} فٹ ${inches} انچ (${cm} سم)`,
    };
  }

  // 6. Height range from formatPartnerPreferences e.g. `5'6" - 5'9" (168 - 175 cm)`
  const heightRangeMatch = clean.match(/(\d+)'(\d+)"\s*-\s*(\d+)'(\d+)"\s*\((\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*cm\)/i);
  if (heightRangeMatch) {
    const [, f1, i1, f2, i2, c1, c2] = heightRangeMatch;
    return {
      en: `${f1}'${i1}" – ${f2}'${i2}" (${Math.round(Number(c1))}–${Math.round(Number(c2))} cm)`,
      ur: `${f1} فٹ ${i1} انچ تا ${f2} فٹ ${i2} انچ (${Math.round(Number(c1))} تا ${Math.round(Number(c2))} سم)`,
    };
  }

  const heightMinMatch = clean.match(/(\d+)'(\d+)"\+\s*\((\d+(?:\.\d+)?)\s*cm\+\)/i);
  if (heightMinMatch) {
    const [, f1, i1, c1] = heightMinMatch;
    return {
      en: `${f1}'${i1}"+ (${Math.round(Number(c1))} cm+)`,
      ur: `${f1} فٹ ${i1} انچ یا اس سے زائد (${Math.round(Number(c1))} سم+)`,
    };
  }

  const heightMaxMatch = clean.match(/Up to\s*(\d+)'(\d+)"\s*\((\d+(?:\.\d+)?)\s*cm\)/i);
  if (heightMaxMatch) {
    const [, f1, i1, c1] = heightMaxMatch;
    return {
      en: `Up to ${f1}'${i1}" (${Math.round(Number(c1))} cm)`,
      ur: `زیادہ سے زیادہ ${f1} فٹ ${i1} انچ (${Math.round(Number(c1))} سم)`,
    };
  }

  // 7. Weight single or range ("65 kg", "55 - 70 kg", "55+ kg", "Up to 70 kg")
  const weightRangeMatch = clean.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*kg$/i);
  if (weightRangeMatch) {
    return {
      en: `${weightRangeMatch[1]} – ${weightRangeMatch[2]} kg`,
      ur: `${weightRangeMatch[1]} تا ${weightRangeMatch[2]} کلوگرام`,
    };
  }
  const weightSingleMatch = clean.match(/^(\d+(?:\.\d+)?)\s*kg$/i);
  if (weightSingleMatch) {
    return {
      en: `${weightSingleMatch[1]} kg`,
      ur: `${weightSingleMatch[1]} کلوگرام`,
    };
  }
  const weightPlusMatch = clean.match(/^(\d+(?:\.\d+)?)\+\s*kg$/i);
  if (weightPlusMatch) {
    return {
      en: `${weightPlusMatch[1]}+ kg`,
      ur: `${weightPlusMatch[1]} کلوگرام یا زائد`,
    };
  }
  const weightUpToMatch = clean.match(/^Up to\s*(\d+(?:\.\d+)?)\s*kg$/i);
  if (weightUpToMatch) {
    return {
      en: `Up to ${weightUpToMatch[1]} kg`,
      ur: `زیادہ سے زیادہ ${weightUpToMatch[1]} کلوگرام`,
    };
  }

  // 8. Age ranges ("24 - 28 yrs", "24+ yrs", "Up to 28 yrs")
  const ageRangeMatch = clean.match(/^(\d+)\s*-\s*(\d+)\s*yrs$/i);
  if (ageRangeMatch) {
    return {
      en: `${ageRangeMatch[1]} – ${ageRangeMatch[2]} yrs`,
      ur: `${ageRangeMatch[1]} تا ${ageRangeMatch[2]} سال`,
    };
  }
  const agePlusMatch = clean.match(/^(\d+)\+\s*yrs$/i);
  if (agePlusMatch) {
    return {
      en: `${agePlusMatch[1]}+ yrs`,
      ur: `${agePlusMatch[1]} سال یا زائد`,
    };
  }
  const ageUpToMatch = clean.match(/^Up to\s*(\d+)\s*yrs$/i);
  if (ageUpToMatch) {
    return {
      en: `Up to ${ageUpToMatch[1]} yrs`,
      ur: `زیادہ سے زیادہ ${ageUpToMatch[1]} سال`,
    };
  }

  // 9. Income ("Rs 150,000 - 250,000", "Rs 150,000+", "Up to Rs 200,000", "PKR 150,000")
  const incRangeMatch = clean.match(/^(?:Rs|PKR)\s*([\d,]+)\s*-\s*(?:Rs|PKR)?\s*([\d,]+)$/i);
  if (incRangeMatch) {
    if (incRangeMatch[2] === '0') {
      return {
        en: `PKR ${incRangeMatch[1]}`,
        ur: `${incRangeMatch[1]} روپے`,
      };
    }
    return {
      en: `PKR ${incRangeMatch[1]} – ${incRangeMatch[2]}`,
      ur: `${incRangeMatch[1]} تا ${incRangeMatch[2]} روپے`,
    };
  }
  const incPlusMatch = clean.match(/^(?:Rs|PKR)\s*([\d,]+)\+$/i);
  if (incPlusMatch) {
    return {
      en: `PKR ${incPlusMatch[1]}+`,
      ur: `${incPlusMatch[1]} روپے یا زائد`,
    };
  }
  const incUpToMatch = clean.match(/^Up to\s*(?:Rs|PKR)\s*([\d,]+)$/i);
  if (incUpToMatch) {
    return {
      en: `Up to PKR ${incUpToMatch[1]}`,
      ur: `زیادہ سے زیادہ ${incUpToMatch[1]} روپے`,
    };
  }
  const incSingleMatch = clean.match(/^(?:Rs|PKR)\s*([\d,]+)$/i);
  if (incSingleMatch) {
    return {
      en: `PKR ${incSingleMatch[1]}`,
      ur: `${incSingleMatch[1]} روپے`,
    };
  }

  // 10. If text already contains Urdu script, put it in ur as well
  if (/[\u0600-\u06FF]/.test(clean)) {
    return { en: clean, ur: clean };
  }

  // 11. Comma-separated multi-location strings e.g. "Pakistan, Punjab, Lahore"
  if (clean.includes(',')) {
    const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      const translatedParts = parts.map((p) => translateSingleToken(p));
      const allHaveUr = translatedParts.every((t) => Boolean(t.ur));
      if (allHaveUr) {
        return {
          en: translatedParts.map((t) => t.en).join(', '),
          ur: translatedParts.map((t) => t.ur).join('، '),
        };
      }
    }
  }

  return { en: formatPrettyEnglish(clean), ur: '' };
}

const PRESERVED_ACRONYMS = new Set([
  'CNIC',
  'PKR',
  'BS',
  'BBA',
  'BE',
  'MS',
  'MBA',
  'MBBS',
  'PHD',
  'IT',
  'UK',
  'UAE',
  'USA',
]);

function formatPrettyEnglish(text: string): string {
  const trimmed = text.trim();
  if (/^[A-Z0-9_]+$/.test(trimmed)) {
    if (PRESERVED_ACRONYMS.has(trimmed)) return trimmed;
    if (trimmed.includes('_') || trimmed.length >= 2) {
      return trimmed
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return text;
}

/**
 * Resolve a field's English and Urdu display values.
 * Handles preference importance suffixes like "Sunni (Must Have)",
 * reference store lookups, enums, dates, and measurements.
 */
export function formatBilingualValue(
  labelOrPath: string,
  rawVal: unknown,
  explicitUr?: string | null
): BilingualText {
  if (rawVal === null || rawVal === undefined || rawVal === '') {
    return { en: 'N/A', ur: '' };
  }

  const strVal = String(rawVal).trim();
  if (!strVal || strVal.toUpperCase() === 'N/A') {
    return { en: 'N/A', ur: '' };
  }

  // If explicit Urdu string was provided from DB view
  if (explicitUr && explicitUr.trim()) {
    return {
      en: formatPrettyEnglish(strVal),
      ur: explicitUr.trim(),
    };
  }

  // Handle preference importance suffix: e.g., "Sunni (Must Have)" or "24 - 28 yrs (High)"
  const impSuffixMatch = strVal.match(/^(.+?)\s*\((Must Have|Mandatory|High|Medium|Low|Doesn't Matter)\)$/i);
  if (impSuffixMatch) {
    const core = impSuffixMatch[1].trim();
    const impRaw = impSuffixMatch[2].trim();
    const impUr = IMPORTANCE_URDU_MAP[impRaw.toLowerCase()] || impRaw;
    const coreBilingual = translateSingleToken(core);

    return {
      en: `${coreBilingual.en} (${impRaw})`,
      ur: coreBilingual.ur ? `${coreBilingual.ur} (${impUr})` : impUr,
    };
  }

  // Income field when raw number or string number
  const keyLower = labelOrPath.toLowerCase();
  if ((keyLower.includes('income') || keyLower.includes('monthly_income')) && /^\d+$/.test(strVal)) {
    const formatted = Number(strVal).toLocaleString();
    return {
      en: `PKR ${formatted}`,
      ur: `${formatted} روپے`,
    };
  }

  // Height field when raw number
  if (keyLower.includes('height') && /^\d+(?:\.\d+)?$/.test(strVal)) {
    return translateSingleToken(`${strVal} cm`);
  }

  // Weight field when raw number
  if (keyLower.includes('weight') && /^\d+(?:\.\d+)?$/.test(strVal)) {
    return translateSingleToken(`${strVal} kg`);
  }

  return translateSingleToken(strVal);
}

/**
 * Look up an explicit Urdu field value from `item.profileData` or `preferences`
 * when available from `vw_profile_core` / `vw_profile_active_preferences`.
 */
export function resolveExplicitUrduFromProfile(
  label: string,
  profileData: any,
  preferences?: any
): string | null {
  if (!profileData && !preferences) return null;
  const key = label.trim().toLowerCase();

  if (profileData) {
    if (key === 'religion') return profileData.religion_name_ur || null;
    if (key === 'sect') return profileData.sect_name_ur || null;
    if (key === 'caste') return profileData.caste_name_ur || null;
    if (key === 'mother tongue') return profileData.mother_tongue_name_ur || null;
    if (key === 'current country') return profileData.current_country_name_ur || null;
    if (key === 'current city') return profileData.current_city_name_ur || null;
    if (key === 'permanent city') return profileData.permanent_city_name_ur || null;
    if (key === 'residency' || key === 'nationality') return profileData.nationality_country_name_ur || null;
  }

  if (preferences) {
    if (key === 'min education') return preferences.education?.minimum_education_level_name_ur || null;
    if (key === 'preferred profession') return preferences.profession?.preferred_occupation_name_ur || null;
    if (key === 'religion') return preferences.religion?.religion_name_ur || null;
    if (key === 'sect') return preferences.religion?.sect_name_ur || null;
    if (key === 'caste') return preferences.religion?.caste_name_ur || null;
    if (key === 'preferred country') return preferences.location?.country_name_ur || null;
    if (key === 'preferred province') return preferences.location?.province_name_ur || null;
    if (key === 'preferred city') return preferences.location?.city_name_ur || null;
  }

  return null;
}

export function isMeaningfulFieldValue(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  if (!s) return false;
  const upper = s.toUpperCase();
  return upper !== 'N/A' && upper !== 'UNDEFINED' && upper !== 'NULL';
}

