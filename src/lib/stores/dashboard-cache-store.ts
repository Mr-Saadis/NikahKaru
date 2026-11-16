import { create } from 'zustand';
import type {
  AdminOverviewData,
  AgentOverviewData,
  ManagerOverviewData,
} from '@/lib/types/overview.types';

interface CachedEntry<T> {
  data: T;
  lastUpdated: string;
}

interface DashboardCacheState {
  manager: Record<number, CachedEntry<ManagerOverviewData>>;
  admin: Record<number, CachedEntry<AdminOverviewData>>;
  agent: CachedEntry<AgentOverviewData> | null;

  setManager: (days: number, data: ManagerOverviewData, lastUpdated: string) => void;
  setAdmin: (days: number, data: AdminOverviewData, lastUpdated: string) => void;
  setAgent: (data: AgentOverviewData, lastUpdated: string) => void;

  invalidateManager: () => void;
  invalidateAdmin: () => void;
  invalidateAgent: () => void;
  clearAll: () => void;
}

export const useDashboardCacheStore = create<DashboardCacheState>((set) => ({
  manager: {},
  admin: {},
  agent: null,

  setManager: (days, data, lastUpdated) =>
    set((state) => ({
      manager: { ...state.manager, [days]: { data, lastUpdated } },
    })),

  setAdmin: (days, data, lastUpdated) =>
    set((state) => ({
      admin: { ...state.admin, [days]: { data, lastUpdated } },
    })),

  setAgent: (data, lastUpdated) =>
    set({ agent: { data, lastUpdated } }),

  invalidateManager: () => set({ manager: {} }),
  invalidateAdmin: () => set({ admin: {} }),
  invalidateAgent: () => set({ agent: null }),
  clearAll: () => set({ manager: {}, admin: {}, agent: null }),
}));

