export interface ReleaseItem {
  id: string;
  request_id: string;
  source_profile: {
    id: string;
    profile_code: string;
    full_name: string;
    gender: 'MALE' | 'FEMALE';
  };
  candidate_profile: {
    id: string;
    profile_code: string;
    full_name: string;
    gender: 'MALE' | 'FEMALE';
    age: number;
    city: string;
    caste: string;
    education: string;
  };
  compatibility_score: number;
  approved_by_manager: string;
  approved_at_relative: string;
  released_at: string;
  status: string;
}

export interface StaffDashboardData {
  role: 'AGENT';
  stats: {
    assignedProfiles: number;
    releasedForClient: number;
    activeInTalks: number;
    draftsPending: number;
  };
  releases: ReleaseItem[];
  requestsPipeline: {
    id: string;
    profile_name: string;
    submitted_date: string;
    assigned_manager: string;
    status: string;
  }[];
  drafts: {
    id: string;
    name: string;
    age: number;
    city: string;
    updated_at: string;
    current_step: number;
    total_steps: number;
    step_name: string;
  }[];
  activePairs: any[];
}

export interface ManagerDashboardData {
  role: 'MANAGER';
  stats: {
    pendingRequests: number;
    releasedToday: number;
    activeInTalks: number;
    staffHandled: number;
  };
  requests: {
    id: string;
    request_id: string;
    request_code: string;
    source_profile: {
      id: string;
      profile_code: string;
      full_name: string;
      gender: 'MALE' | 'FEMALE';
      age: number;
      city: string;
      caste: string;
      education: string;
    };
    requested_by_agent: string;
    assigned_to_manager: string;
    status: 'PENDING' | 'IN_REVIEW' | 'COMPLETED';
    board_status: string;
    created_at_relative: string;
    waiting_hours: number;
    is_urgent: boolean;
    notes?: string;
  }[];
  staffWorkload: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    currently_owned: number;
    stuck_in_draft: number;
    requests_submitted: number;
    active_pairs_in_progress: number;
    capacity_status: 'OVERLOADED' | 'BALANCED' | 'AVAILABLE';
  }[];
}

export interface AdminDashboardData {
  role: 'HIGH_LEVEL_ADMIN';
  health: {
    total_active_profiles: number;
    male_active_profiles: number;
    female_active_profiles: number;
    gender_ratio_male_pct: number;
    gender_ratio_female_pct: number;
    active_in_progress_matches: number;
    total_match_runs: number;
    total_releases: number;
    avg_request_sla_hours: number;
    accepted_matches_this_month: number;
    rejected_matches_this_month: number;
  };
  managersPerformance: {
    id: string;
    name: string;
    email: string;
    pending_requests: number;
    official_match_runs: number;
    releases_approved: number;
    avg_turnaround_hours: number;
    reassignments_count: number;
    is_bottleneck: boolean;
  }[];
  agentsWorkload: {
    id: string;
    name: string;
    email: string;
    currently_owned: number;
    stuck_in_draft: number;
    requests_submitted: number;
    active_pairs_in_progress: number;
    matches_accepted: number;
  }[];
  auditLogs: {
    id: string;
    actor_name: string;
    action: string;
    details: string;
    created_at_relative: string;
  }[];
  demographics?: {
    occupations: DemographicsItem[];
    educations: DemographicsItem[];
    locationsCountry: DemographicsItem[];
    locationsProvince: DemographicsItem[];
    sects: DemographicsItem[];
    incomes: DemographicsItem[];
  };
}

export interface DemographicsItem {
  id: string;
  name: string;
  total: number;
  male: number;
  female: number;
}

export class DashboardService {
  static async getDashboardData(role?: string): Promise<StaffDashboardData | ManagerDashboardData | AdminDashboardData> {
    const params = new URLSearchParams();
    if (role) params.set('role', role);

    const res = await fetch(`/api/dashboard?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load dashboard data');
    }

    return res.json();
  }
}
