import type { RequestItem, RequestStatus } from './types';
import { STAFF_NAMES } from './constants';

// ============================================================
// Mock Data — 32 deterministic records
// Spread 7/6/5/4/3/4/3 across columns (new → feedback)
// ============================================================

const STATUS_DISTRIBUTION: { status: RequestStatus; count: number }[] = [
  { status: 'new', count: 5 },
  { status: 'first', count: 5 },
  { status: 'second', count: 4 },
  { status: 'responded', count: 4 },
  { status: 'done', count: 4 },
  { status: 'pause', count: 3 },
  { status: 'archive', count: 4 },
  { status: 'feedback', count: 3 },
];

const FIRST_NAMES = [
  'Fatima', 'Omar', 'Kamran', 'Ali', 'Iqra',
  'Rabia', 'Faisal', 'Zainab', 'Hassan', 'Sadia',
  'Umar', 'Noor', 'Shahid', 'Amina', 'Tariq',
  'Hira', 'Bilal', 'Maham', 'Junaid', 'Asma',
  'Waqas', 'Mehreen', 'Naveed', 'Saba', 'Imran',
  'Ayesha', 'Khalid', 'Farah', 'Adeel', 'Rimsha',
  'Danish', 'Alina',
];

const LAST_NAMES = [
  'Noor', 'Farooq', 'Akbar', 'Hamza', 'Siddiqui',
  'Aslam', 'Butt', 'Awan', 'Shah', 'Raza',
  'Javed', 'Riaz', 'Akhtar', 'Sultan', 'Qureshi',
  'Malik', 'Iqbal', 'Abbas', 'Khan', 'Rehman',
  'Hussain', 'Tahir', 'Ahmed', 'Baig', 'Memon',
  'Chaudhry', 'Durrani', 'Ghani', 'Afridi', 'Baloch',
  'Gul', 'Mirza',
];

function padNum(n: number, len: number): string {
  return String(n).padStart(len, '0');
}

function generateMockData(): RequestItem[] {
  const items: RequestItem[] = [];
  let globalIndex = 0;

  for (const { status, count } of STATUS_DISTRIBUTION) {
    for (let i = 0; i < count; i++) {
      const idx = globalIndex;
      const cnicBase = 35202;
      const cnicMid = 1000000 + idx * 123456;
      const cnicEnd = (idx % 10);
      const cnic = `${cnicBase}-${padNum(cnicMid % 10000000, 7)}-${cnicEnd}`;

      const phonePrefix = ['0300', '0310', '0320', '0330', '0340'][idx % 5];
      const phoneNum = padNum(1234567 + idx * 98765, 7);
      const phone = `${phonePrefix}-${phoneNum}`;

      const day = padNum((idx % 28) + 1, 2);
      const month = '09';
      const year = '2026';
      const date = `${year}-${month}-${day}`;

      items.push({
        id: `req-${padNum(idx + 1, 3)}`,
        name: `${FIRST_NAMES[idx % FIRST_NAMES.length]} ${LAST_NAMES[idx % LAST_NAMES.length]}`,
        cnic,
        phone,
        staff: STAFF_NAMES[idx % STAFF_NAMES.length],
        date,
        status,
        later: false,
      });

      globalIndex++;
    }
  }

  return items;
}

/**
 * Data-access function — replace this with Supabase fetch later.
 */
export async function getRequests(): Promise<RequestItem[]> {
  return generateMockData();
}
