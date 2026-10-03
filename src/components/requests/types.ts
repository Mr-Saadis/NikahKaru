// ============================================================
// Request Board Types
// ============================================================

export type RequestStatus =
  | 'new'
  | 'first'
  | 'second'
  | 'responded'
  | 'done'
  | 'pause'
  | 'archive'
  | 'feedback';

export interface RequestItem {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  staff: string;
  /** ISO yyyy-mm-dd */
  date: string;
  status: RequestStatus;
  /** Client-only flag — card is in Respond Later panel */
  later: boolean;
}

export interface ColumnDef {
  label: string;
  key: RequestStatus;
  color: string;
  cardBg: string;
  filledDashes: 1 | 2 | 3;
}

export interface FilterState {
  search: string;
  dateFrom: string;
  dateTo: string;
  staff: string;
}

export type ExpandedFilter = 'search' | 'date' | 'staff' | null;
