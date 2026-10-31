// ============================================================================
// Overview RPC Types for Agent, Manager, and Admin Dashboards
// Mirroring the responses from overview_rpcs.sql
// ============================================================================

// ----------------------------------------------------------------------------
// 1. AGENT OVERVIEW
// ----------------------------------------------------------------------------

export interface AgentKPIs {
  assigned_profiles: number;
  drafts_pending: number;
  released_for_client: number;
  shared_with_family: number;
  open_requests: number;
  awaiting_download: number;
  completed_this_month: number;
}

export interface AgentPipeline {
  with_manager: number;
  ready: number;
  downloaded: number;
  completed: number;
}

export interface AgentAttentionItem {
  kind: 'release_ready' | 'assigned_to_you' | 'no_preferences' | 'stale_draft' | 'ready_to_request';
  entity_id: string;
  profile_id: string;
  profile_name: string;
  since: string;
}

export interface AgentProfileItem {
  id: string;
  full_name: string;
  gender: string;
  status: string;
  completion_pct: number;
  steps_done: number;
  steps_total: number;
  missing: string[];
  has_preferences: boolean;
  updated_at: string;
}

export interface AgentDraftItem {
  id: string;
  full_name: string;
  gender: string;
  completion_pct: number;
  steps_done: number;
  steps_total: number;
  next_step: string | null;
  updated_at: string;
}

export interface AgentReadyForDeliveryItem {
  release_id: string;
  request_id: string;
  candidate_profile_id: string;
  released_at: string;
  request_status: string;
  full_name: string | null;
  age: number | null;
  city: string | null;
  caste: string | null;
  education: string | null;
  score: number | null;
  released_by_name: string | null;
}

export interface AgentRequestItem {
  id: string;
  status: string;
  created_at: string;
  profile_id: string;
  profile_name: string | null;
  reviewed_by_name: string | null;
}

export interface AgentOverviewData {
  role: 'AGENT';
  generated_at: string;
  kpis: AgentKPIs;
  pipeline: AgentPipeline;
  attention: AgentAttentionItem[];
  profiles: AgentProfileItem[];
  drafts: AgentDraftItem[];
  ready_for_delivery: AgentReadyForDeliveryItem[];
  requests: AgentRequestItem[];
  tracking: {
    matches_active: number;
  };
}

// ----------------------------------------------------------------------------
// 2. MANAGER OVERVIEW
// ----------------------------------------------------------------------------

export interface ManagerKPIs {
  pending: number;
  released_awaiting_agent: number;
  downloaded: number;
  oldest_waiting_hours: number | null;
  overdue: number;
  completed_in_range: number;
  releases_in_range: number;
  releases_prev_range: number | null;
  runs_in_range: number;
  avg_release_hours: number | null;
}

export type ManagerPipeline = Record<string, number>;

export interface ManagerQueueItem {
  request_id: string;
  profile_id: string;
  full_name: string | null;
  age: number | null;
  city: string | null;
  caste: string | null;
  agent_name: string | null;
  waiting_hours: number;
  sla_state: 'fresh' | 'warning' | 'overdue';
  is_repeat: boolean;
}

export interface ManagerWorkloadItem {
  id: string;
  full_name: string;
  active_profiles: number;
  drafts: number;
  open_requests: number;
  load: 'OVERLOADED' | 'BALANCED' | 'AVAILABLE';
}

export interface ManagerStuckReleaseItem {
  release_id: string;
  request_id: string;
  released_at: string;
  days_waiting: number;
  source_name: string | null;
  candidate_name: string | null;
  agent_name: string | null;
}

export interface ManagerHotCandidateItem {
  candidate_profile_id: string;
  requests_count: number;
  candidate_name: string | null;
}

export interface ManagerScoreQuality {
  excellent: number;
  good: number;
  borderline: number;
  avg: number | null;
}

export interface ManagerLowMatchItem {
  profile_id: string;
  full_name: string | null;
  executed_at: string;
  candidates: number;
}

export interface ManagerOrphanedProfiles {
  count: number;
  items: {
    id: string;
    full_name: string | null;
  }[];
}

export interface ManagerRecentReleaseItem {
  release_id: string;
  released_at: string;
  source_name: string | null;
  candidate_name: string | null;
  agent_name: string | null;
}

export interface ManagerFeedback {
  tracking_active: boolean;
  recent: {
    type: string;
    reason: string | null;
    notes: string | null;
    created_at: string;
  }[];
  top_reasons: {
    reason: string;
    n: number;
  }[];
}

export interface ManagerOverviewData {
  role: 'MANAGER';
  generated_at: string;
  range_days: number;
  sla_hours: number;
  kpis: ManagerKPIs;
  pipeline: ManagerPipeline;
  queue: ManagerQueueItem[];
  agent_workload: ManagerWorkloadItem[];
  stuck_releases: ManagerStuckReleaseItem[];
  hot_candidates: ManagerHotCandidateItem[];
  score_quality: ManagerScoreQuality;
  low_match: ManagerLowMatchItem[];
  orphaned_profiles: ManagerOrphanedProfiles;
  recent_releases: ManagerRecentReleaseItem[];
  feedback: ManagerFeedback;
  tracking: {
    matches_rows: number;
  };
}

// ----------------------------------------------------------------------------
// 3. ADMIN OVERVIEW
// ----------------------------------------------------------------------------

export interface AdminKPIs {
  total_profiles: number;
  active_profiles: number;
  draft_profiles: number;
  paused_profiles: number;
  male_active: number;
  female_active: number;
  requests_in_range: number;
  requests_prev_range: number | null;
  pending_requests: number;
  overdue_requests: number;
  runs_in_range: number;
  releases_in_range: number;
  completed_in_range: number;
  avg_release_hours: number | null;
}

export interface AdminFunnelStage {
  stage: 'Registered' | 'Active' | 'Requested' | 'Matched' | 'Released' | 'Shared' | 'Completed';
  n: number;
}

export type AdminProfileStatus = Record<string, number>;

export interface AdminTrendPoint {
  week: string;
  profiles: number;
  requests: number;
}

export interface AdminHeatmapCell {
  city: string;
  age_bucket: '18-22' | '23-27' | '28-32' | '33-37' | '38+';
  gender: 'MALE' | 'FEMALE';
  n: number;
}

export interface AdminDemandSupplyItem {
  city: string;
  demand_from_males: number;
  females_available: number;
  demand_from_females: number;
  males_available: number;
}

export interface AdminMandatoryCriterion {
  criterion: string;
  n: number;
}

export interface AdminManagerPerfItem {
  id: string;
  full_name: string;
  pending_queue: number;
  releases_approved: number;
  runs: number;
  avg_release_hours: number | null;
}

export interface AdminAgentPerfItem {
  id: string;
  full_name: string;
  active_profiles: number;
  drafts: number;
  profiles_created: number;
  requests: number;
  completed: number;
}

export interface AdminLowMatchItem {
  profile_id: string;
  full_name: string | null;
  executed_at: string;
  candidates: number;
}

export interface AdminScoreDistribution {
  excellent: number;
  good: number;
  borderline: number;
}

export interface AdminFieldReleasedItem {
  field: string;
  n: number;
  sensitive: boolean;
}

export interface AdminUsersRoleCount {
  role: string;
  status: string;
  n: number;
}

export interface AdminDataQuality {
  active_without_preferences: number;
  stale_drafts_14d: number;
  active_without_agent: number;
  top_other_caste: {
    value: string;
    n: number;
  }[];
}

export interface AdminRejections {
  tracking_active: boolean;
  top_reasons: {
    reason: string;
    n: number;
  }[];
}

export interface AdminAlgorithmVersion {
  version: string;
  runs: number;
}

export interface AdminOverviewData {
  role: 'HIGH_LEVEL_ADMIN';
  generated_at: string;
  range_days: number;
  kpis: AdminKPIs;
  funnel: AdminFunnelStage[];
  profile_status: AdminProfileStatus;
  trend: AdminTrendPoint[];
  pool_heatmap: AdminHeatmapCell[];
  demand_vs_supply: AdminDemandSupplyItem[];
  mandatory_criteria: AdminMandatoryCriterion[];
  managers: AdminManagerPerfItem[];
  agents: AdminAgentPerfItem[];
  low_match: AdminLowMatchItem[];
  score_distribution: AdminScoreDistribution;
  fields_released: AdminFieldReleasedItem[];
  users: {
    by_role: AdminUsersRoleCount[];
    agents_inactive_7d: number;
  };
  data_quality: AdminDataQuality;
  rejections: AdminRejections;
  algorithm: {
    versions: AdminAlgorithmVersion[];
  };
  tracking: {
    matches_rows: number;
    feedback_rows: number;
  };
  // Real DB audit logs and Demographics kept as instructed (Rule 13 & 14)
  auditLogs?: {
    id: string;
    actor_name: string;
    action: string;
    details: string;
    created_at_relative: string;
  }[];
  demographics?: {
    occupations: { id: string; name: string; total: number; male: number; female: number }[];
    educations: { id: string; name: string; total: number; male: number; female: number }[];
    locationsCountry: { id: string; name: string; total: number; male: number; female: number }[];
    locationsProvince: { id: string; name: string; total: number; male: number; female: number }[];
    sects: { id: string; name: string; total: number; male: number; female: number }[];
    incomes: { id: string; name: string; total: number; male: number; female: number }[];
  };
}

