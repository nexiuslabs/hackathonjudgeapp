export type UnlockRequestStatus = 'idle' | 'pending' | 'approved' | 'rejected';

export interface UnlockRequestState {
  status: UnlockRequestStatus;
  note: string | null;
  requestedAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
}

export interface BallotSubmissionPayload {
  eventId: string;
  teamId: string;
  scores: Record<string, number>;
  comments: {
    strength: string;
    improvement: string;
  };
  submittedAt: string;
}

export interface BallotLifecycleSnapshot {
  eventId: string;
  teamId: string;
  locked: boolean;
  queuedSubmission: boolean;
  submissionCount: number;
  lastSubmittedAt: string | null;
  unlockRequest: UnlockRequestState;
  pendingSubmissionPayload: BallotSubmissionPayload | null;
}

export interface UnlockResolution {
  status: Extract<UnlockRequestStatus, 'approved' | 'rejected'>;
  resolutionNote?: string | null;
}
