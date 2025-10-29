import type {
  BallotLifecycleSnapshot,
  BallotSubmissionPayload,
  UnlockResolution,
  UnlockRequestState,
} from '@/types/ballot';

const STORAGE_NAMESPACE = 'hackathonjudgeapp.ballotLifecycle.v1';
const memoryStore = new Map<string, BallotLifecycleSnapshot>();
const EVENT_PREFIX = 'hackathonjudgeapp:ballotLifecycle:update:';

type StoredSnapshot = BallotLifecycleSnapshot;

type LifecycleUpdateListener = (snapshot: BallotLifecycleSnapshot) => void;

function getStorageKey(eventId: string, teamId: string) {
  return `${STORAGE_NAMESPACE}:${eventId}:${teamId}`;
}

function emitUpdate(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const eventName = `${EVENT_PREFIX}${key}`;
  window.dispatchEvent(new CustomEvent(eventName));
}

function createEmptyUnlockState(): UnlockRequestState {
  return {
    status: 'idle',
    note: null,
    requestedAt: null,
    resolvedAt: null,
    resolutionNote: null,
  };
}

function createDefaultSnapshot(eventId: string, teamId: string): StoredSnapshot {
  return {
    eventId,
    teamId,
    locked: false,
    queuedSubmission: false,
    submissionCount: 0,
    lastSubmittedAt: null,
    unlockRequest: createEmptyUnlockState(),
    pendingSubmissionPayload: null,
  };
}

function readFromLocalStorage(key: string): StoredSnapshot | null {
  if (typeof window === 'undefined') {
    return memoryStore.get(key) ?? null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return memoryStore.get(key) ?? null;
    }

    const parsed = JSON.parse(raw) as StoredSnapshot;
    memoryStore.set(key, parsed);
    return parsed;
  } catch (error) {
    console.warn('Failed to read ballot lifecycle snapshot', error);
    return memoryStore.get(key) ?? null;
  }
}

function writeToLocalStorage(key: string, snapshot: StoredSnapshot) {
  memoryStore.set(key, snapshot);

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(snapshot));
    emitUpdate(key);
  } catch (error) {
    console.warn('Failed to persist ballot lifecycle snapshot', error);
  }
}

function withSnapshot(
  eventId: string,
  teamId: string,
  updater: (snapshot: StoredSnapshot) => StoredSnapshot,
): StoredSnapshot {
  const key = getStorageKey(eventId, teamId);
  const current = readFromLocalStorage(key) ?? createDefaultSnapshot(eventId, teamId);
  const next = updater(current);
  writeToLocalStorage(key, next);
  return next;
}

export function getBallotLifecycleSnapshot(eventId: string, teamId: string): BallotLifecycleSnapshot {
  const key = getStorageKey(eventId, teamId);
  return readFromLocalStorage(key) ?? createDefaultSnapshot(eventId, teamId);
}

export interface PersistSubmissionOptions {
  queueOffline?: boolean;
}

export function persistBallotSubmission(
  payload: Omit<BallotSubmissionPayload, 'submittedAt'> & { submittedAt?: string },
  options: PersistSubmissionOptions = {},
): BallotLifecycleSnapshot {
  const submittedAt = payload.submittedAt ?? new Date().toISOString();
  const offline = Boolean(options.queueOffline);

  return withSnapshot(payload.eventId, payload.teamId, (snapshot) => {
    const nextUnlockState = createEmptyUnlockState();
    return {
      ...snapshot,
      locked: true,
      queuedSubmission: offline,
      submissionCount: snapshot.submissionCount + 1,
      lastSubmittedAt: submittedAt,
      unlockRequest: nextUnlockState,
      pendingSubmissionPayload: offline
        ? {
            eventId: payload.eventId,
            teamId: payload.teamId,
            scores: { ...payload.scores },
            comments: { ...payload.comments },
            submittedAt,
          }
        : null,
    };
  });
}

export function clearPendingSubmission(eventId: string, teamId: string): BallotLifecycleSnapshot {
  return withSnapshot(eventId, teamId, (snapshot) => ({
    ...snapshot,
    queuedSubmission: false,
    pendingSubmissionPayload: null,
  }));
}

export function persistUnlockRequest(
  eventId: string,
  teamId: string,
  note: string,
): BallotLifecycleSnapshot {
  const trimmed = note.trim();
  const requestedAt = new Date().toISOString();

  return withSnapshot(eventId, teamId, (snapshot) => ({
    ...snapshot,
    unlockRequest: {
      status: 'pending',
      note: trimmed || null,
      requestedAt,
      resolvedAt: null,
      resolutionNote: null,
    },
  }));
}

export function cancelUnlockRequest(eventId: string, teamId: string): BallotLifecycleSnapshot {
  return withSnapshot(eventId, teamId, (snapshot) => ({
    ...snapshot,
    unlockRequest: createEmptyUnlockState(),
  }));
}

export function resolveUnlockRequest(
  eventId: string,
  teamId: string,
  resolution: UnlockResolution,
): BallotLifecycleSnapshot {
  const resolvedAt = new Date().toISOString();
  const trimmedNote = resolution.resolutionNote?.trim();

  return withSnapshot(eventId, teamId, (snapshot) => {
    const nextUnlock: UnlockRequestState = {
      status: resolution.status,
      note: snapshot.unlockRequest.note,
      requestedAt: snapshot.unlockRequest.requestedAt,
      resolvedAt,
      resolutionNote: trimmedNote ? trimmedNote : null,
    };

    return {
      ...snapshot,
      locked: resolution.status === 'approved' ? false : snapshot.locked,
      queuedSubmission: resolution.status === 'approved' ? false : snapshot.queuedSubmission,
      pendingSubmissionPayload: resolution.status === 'approved' ? null : snapshot.pendingSubmissionPayload,
      unlockRequest: nextUnlock,
    };
  });
}

export function subscribeToBallotLifecycle(
  eventId: string,
  teamId: string,
  listener: LifecycleUpdateListener,
): () => void {
  const key = getStorageKey(eventId, teamId);
  const eventName = `${EVENT_PREFIX}${key}`;

  const handler = () => {
    listener(getBallotLifecycleSnapshot(eventId, teamId));
  };

  if (typeof window === 'undefined') {
    return () => {};
  }

  const storageHandler = (event: StorageEvent) => {
    if (event.key === key) {
      handler();
    }
  };

  window.addEventListener(eventName, handler as EventListener);
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener(eventName, handler as EventListener);
    window.removeEventListener('storage', storageHandler);
  };
}

export function resetBallotLifecycle(eventId: string, teamId: string) {
  const key = getStorageKey(eventId, teamId);
  memoryStore.delete(key);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(key);
  }
}
