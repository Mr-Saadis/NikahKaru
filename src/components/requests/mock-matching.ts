import type { RequestItem } from './types';

export interface MatchProfile {
  name: string;
  seed: number;
  pct: number;
  age: number;
  city: string;
  job: string;
  cnic: string;
  phone: string;
  sent?: string;
}

export type ProfileGroup = [string, [string, string][]];

const CITY = ["Lahore", "Karachi", "Islamabad", "Faisalabad", "Multan", "Rawalpindi"];
const JOB = ["Software Engineer", "Doctor", "Teacher", "Accountant", "Architect", "Banker", "Pharmacist"];

const FN = ["Fatima","Hassan","Maryam","Ali","Zainab","Omar","Iqra","Danish","Rabia","Talha","Sidra","Faisal","Noor","Kamran","Laiba","Imran","Amna","Shoaib","Hira","Bilal","Sana","Usman","Ayesha","Hamza"];
const LN = ["Noor","Raza","Iqbal","Hamza","Shah","Farooq","Siddiqui","Mehmood","Aslam","Javed","Nadeem","Butt","Akbar","Rauf","Haider","Zafar","Khalid","Malik"];

export const mk = (nm: string, seed: number, pct: number): MatchProfile => ({
  name: nm,
  seed,
  pct,
  age: 23 + seed % 11,
  city: CITY[seed % 6],
  job: JOB[seed % 7],
  cnic: "35202-" + String(1000000 + seed * 61357).slice(0, 7) + "-" + (seed % 9 + 1),
  phone: "03" + (seed % 5) + "0-" + String(1234567 + seed * 38211).slice(0, 7)
});

export const person = (c: RequestItem) => {
  // numeric ID from "req-001" etc
  const id = parseInt(c.id.replace(/\D/g, ''), 10) || 0;
  return {
    name: c.name,
    phone: c.phone,
    cnic: c.cnic,
    age: 23 + id % 11,
    city: CITY[id % 6],
    job: JOB[id % 7]
  };
};

export const prof = (p: ReturnType<typeof person>, seed: number): ProfileGroup[] => {
  const k = (a: string[], i: number) => a[(seed * 7 + i * 5 + i * i) % a.length];
  const ft = 3 + seed % 8;
  return [
    ["Basic Information", [["Full name", p.name], ["Phone", p.phone], ["CNIC", p.cnic], ["Age", p.age + " years"], ["Marital status", k(["Never married", "Never married", "Divorced"], 1)]]],
    ["Physical Attributes", [["Height", "5′ " + ft + "″"], ["Weight", (55 + seed % 25) + " kg"], ["Complexion", k(["Fair", "Wheatish", "Medium", "Dark fair"], 2)], ["Build", k(["Slim", "Average", "Athletic"], 3)]]],
    ["Education & Profession", [["Degree", k(["BS Computer Science", "MBBS", "MBA", "BE Electrical", "BS Accounting", "M.Ed"], 4)], ["Institute", k(["COMSATS", "LUMS", "UET Lahore", "Punjab University", "NUST", "FAST"], 5)], ["Profession", p.job], ["Employer", k(["Private company", "Government", "Self-employed", "Hospital", "Bank"], 6)], ["Monthly income", "Rs " + (60 + seed % 9 * 15) + ",000"]]],
    ["Religion & Culture", [["Religion", "Islam"], ["Sect", k(["Sunni", "Sunni", "Shia"], 7)], ["Caste", k(["Arain", "Rajput", "Sheikh", "Syed", "Jatt"], 8)], ["Mother tongue", k(["Punjabi", "Urdu", "Pashto"], 9)]]],
    ["Location & Residency", [["Current city", p.city], ["Permanent city", k(CITY, 10)], ["Residency", k(["Citizen", "Overseas resident"], 11)]]],
    ["Family Details", [["Father's occupation", k(["Retired", "Businessman", "Teacher", "Government servant"], 12)], ["Siblings", (1 + seed % 4) + " siblings"], ["Family type", k(["Joint", "Nuclear"], 13)], ["Family status", k(["Middle class", "Upper middle class"], 14)]]],
    ["Lifestyle", [["Prayer", k(["Regular", "Mostly regular", "Occasional"], 15)], ["Beard / Hijab", k(["Yes", "No", "Sometimes"], 16)], ["Smoking", k(["No", "No", "No", "Occasionally"], 17)], ["Diet", k(["Non-vegetarian", "Vegetarian"], 18)]]],
    ["Partner Preferences", [["Age range", (21 + seed % 5) + " – " + (30 + seed % 6)], ["Height", k(["5′ 4″+", "5′ 6″+", "Any"], 19)], ["Education", k(["Graduate+", "Masters", "Any"], 20)], ["City", k(["Lahore", "Any city", "Same city"], 21)]]]
  ];
};

export const keysOf = (m: MatchProfile) => prof(person({ id: m.seed.toString(), name: m.name, cnic: m.cnic, phone: m.phone, staff: '', date: '', status: 'new', later: false }), m.seed).flatMap((g, i) => g[1].map((_, j) => i + ":" + j));

export function addDays(iso: string, n: number) {
  let d = new Date(iso && iso.includes('-') ? iso + "T12:00:00" : Date.now());
  if (isNaN(d.getTime())) {
    d = new Date();
  }
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function cands(c: RequestItem, sentExtra: Record<string, string>): [MatchProfile[], MatchProfile[]] {
  const id = parseInt(c.id.replace(/\D/g, ''), 10) || 0;
  const N = 11 + id % 7;
  const used = new Set([c.name]);
  const M: MatchProfile[] = [];
  let j = 1;
  while (M.length < N && j < 200) {
    const n = FN[(id * 5 + j * 7) % 24] + " " + LN[(id * 3 + j * 5) % 18];
    j++;
    if (used.has(n)) continue;
    used.add(n);
    const k = M.length;
    M.push(mk(n, 100 + id * 40 + k, Math.max(52, 97 - id % 4 - Math.floor(k * 2.7))));
  }
  
  [1 + id % 2, 4, 7, 11].filter(i => i < M.length).forEach((i, t) => M[i].sent = addDays(c.date, 2 + t * 2));
  
  Object.entries(sentExtra || {}).forEach(([sd, d]) => {
    const m = M.find(x => x.seed === parseInt(sd, 10));
    if (m) m.sent = d;
  });
  
  return [M, M.filter(m => m.sent).sort((a, b) => b.sent!.localeCompare(a.sent!))];
}
