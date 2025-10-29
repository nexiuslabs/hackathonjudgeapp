export type TimerPhase = 'idle' | 'running' | 'paused' | 'completed';

export type TimerControlAction = 'start' | 'pause' | 'resume' | 'reset' | 'apply_preset';

export type TimerConnectionState = 'idle' | 'connecting' | 'open' | 'error' | 'closed';

export type TimerSnapshotSource = 'network' | 'fallback' | 'optimistic';

export interface TimerState {
  eventId: string;
  phase: TimerPhase;
  durationSeconds: number;
  startedAt: string | null;
  pausedAt: string | null;
  controlOwner: string | null;
  updatedAt: string;
  revision: number;
}

export interface TimerSnapshot extends TimerState {
  fetchedAt: string;
  source: TimerSnapshotSource;
}

export interface TimerPreset {
  id: string;
  eventId: string;
  label: string;
  durationSeconds: number;
  isDefault: boolean;
  archivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TimerShareLink {
  url: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface TimerTokenValidationResult {
  eventId: string;
  token: string;
  expiresAt: string;
  isExpired: boolean;
}

export interface TimerActionTelemetry {
  action: TimerControlAction;
  eventId: string;
  issuedAt: string;
  actorId?: string | null;
  durationSeconds?: number | null;
}
