// ============================================================
// Request Board Types
// ============================================================

export type RequestStatus = string;

export interface RequestItem {
  id: string; // board_id
  name: string;
  cnic: string;
  phone: string;
  staff: string;
  /** ISO yyyy-mm-dd */
  date: string;
  status: RequestStatus;
  /** Client-only flag — card is in Respond Later panel */
  later: boolean;
  /** Whether the manager has read this request */
  isRead?: boolean;
  
  // Full Profile Core Payload
  profileData?: any;
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
