import type {
  AgentOverviewData,
  ManagerOverviewData,
  AdminOverviewData,
} from '@/lib/types/overview.types';

export * from '@/lib/types/overview.types';

export type StaffDashboardData = AgentOverviewData;
export type ManagerDashboardData = ManagerOverviewData;
export type AdminDashboardData = AdminOverviewData;

export interface DemographicsItem {
  id: string;
  name: string;
  total: number;
  male: number;
  female: number;
}

export class DashboardService {
  private static activeControllers: Map<string, AbortController> = new Map();

  static async getDashboardData(
    role?: string,
    days?: number,
    slaHours?: number
  ): Promise<AgentOverviewData | ManagerOverviewData | AdminOverviewData | null> {
    const key = role || 'DEFAULT';

    // Cancel any in-flight request for this role to prevent stale responses
    const existingCtrl = this.activeControllers.get(key);
    if (existingCtrl) {
      try {
        existingCtrl.abort();
      } catch {
        // Ignore cancellation error
      }
    }

    const controller = new AbortController();
    this.activeControllers.set(key, controller);

    try {
      const params = new URLSearchParams();
      if (role) params.set('role', role);
      if (days !== undefined && days !== null) params.set('days', days.toString());
      if (slaHours !== undefined && slaHours !== null) params.set('sla_hours', slaHours.toString());

      const res = await fetch(`/api/dashboard?${params.toString()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMessage = err.error || err.details || 'Failed to load dashboard data';
        throw new Error(errMessage);
      }

      return await res.json();
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return null;
      }
      throw err;
    } finally {
      if (this.activeControllers.get(key) === controller) {
        this.activeControllers.delete(key);
      }
    }
  }
}
