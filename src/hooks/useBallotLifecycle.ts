import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  cancelUnlockRequest,
  getBallotLifecycleSnapshot,
  persistBallotSubmission,
  persistUnlockRequest,
  subscribeToBallotLifecycle,
} from '@/lib/ballot-lifecycle';
import type { BallotLifecycleSnapshot } from '@/types/ballot';

type SubmitResult = 'submitted' | 'queued';

export interface UseBallotLifecycleOptions {
  eventId: string;
  teamId: string;
}

export interface SubmitBallotInput {
  scores: Record<string, number>;
  comments: {
    strength: string;
    improvement: string;
  };
}

export interface UseBallotLifecycleResult {
  locked: boolean;
  isSubmitting: boolean;
  queuedSubmission: boolean;
  lastSubmittedAt: Date | null;
  unlockRequest: BallotLifecycleSnapshot['unlockRequest'];
  submitBallot: (payload: SubmitBallotInput) => Promise<SubmitResult>;
  requestUnlock: (note: string) => Promise<void>;
  cancelUnlock: () => void;
  submissionError: string | null;
  unlockRequestError: string | null;
  clearSubmissionError: () => void;
  isUnlocking: boolean;
}

export function useBallotLifecycle({ eventId, teamId }: UseBallotLifecycleOptions) {
  const [snapshot, setSnapshot] = useState<BallotLifecycleSnapshot>(() =>
    getBallotLifecycleSnapshot(eventId, teamId),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockRequestError, setUnlockRequestError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToBallotLifecycle(eventId, teamId, (nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });
  }, [eventId, teamId]);

  const submitBallot = useCallback(
    async (payload: SubmitBallotInput) => {
    if (snapshot.locked) {
      throw new Error('This ballot is already locked.');
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const offline = typeof navigator !== 'undefined' ? navigator.onLine === false : false;
      const result = persistBallotSubmission(
        {
          eventId,
          teamId,
          scores: payload.scores,
          comments: payload.comments,
        },
        { queueOffline: offline },
      );
      setSnapshot(result);
      return offline ? 'queued' : 'submitted';
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'We could not submit your scores. Please try again.',
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [eventId, snapshot.locked, teamId]);

  const requestUnlock = useCallback(
    async (note: string) => {
      if (snapshot.unlockRequest.status === 'pending') {
        return;
      }

      setIsUnlocking(true);
      setUnlockRequestError(null);

      try {
        const next = persistUnlockRequest(eventId, teamId, note);
        setSnapshot(next);
      } catch (error) {
        setUnlockRequestError(
          error instanceof Error
            ? error.message
            : 'We could not request an unlock. Please try again shortly.',
        );
        throw error;
      } finally {
        setIsUnlocking(false);
      }
    },
    [eventId, snapshot.unlockRequest.status, teamId],
  );

  const cancelUnlock = useCallback(() => {
    if (snapshot.unlockRequest.status === 'pending') {
      const next = cancelUnlockRequest(eventId, teamId);
      setSnapshot(next);
    }
  }, [eventId, snapshot.unlockRequest.status, teamId]);

  const lastSubmittedAt = useMemo(
    () => (snapshot.lastSubmittedAt ? new Date(snapshot.lastSubmittedAt) : null),
    [snapshot.lastSubmittedAt],
  );

  const clearSubmissionError = useCallback(() => setSubmissionError(null), []);

  return {
    locked: snapshot.locked,
    isSubmitting,
    queuedSubmission: snapshot.queuedSubmission,
    lastSubmittedAt,
    unlockRequest: snapshot.unlockRequest,
    submitBallot,
    requestUnlock,
    cancelUnlock,
    submissionError,
    unlockRequestError,
    clearSubmissionError,
    isUnlocking,
  } satisfies UseBallotLifecycleResult;
}
