export type AdminEventSnapshotSource = 'supabase' | 'fallback';

export interface AdminEventSnapshot {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  timezone: string | null;
  location: string | null;
  startAt: string | null;
  endAt: string | null;
  totalJudges: number | null;
  totalTeams: number | null;
  fetchedAt: string;
  source: AdminEventSnapshotSource;
}
