import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_PREFIX = 'hackathonjudgeapp.commentDraft';
const DEFAULT_MAX_LENGTH = 1000;
const DEFAULT_WARNING_THRESHOLD = 140;
const DEFAULT_DEBOUNCE_MS = 800;

type CommentStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type CommentFieldKey = 'strength' | 'improvement';

interface StoredCommentDraft {
  strength: string;
  improvement: string;
  updatedAt: string;
}

export interface UseCommentFieldsOptions {
  storageKey: string;
  maxLength?: number;
  warningThreshold?: number;
  debounceMs?: number;
  initialStrength?: string;
  initialImprovement?: string;
  persist?: boolean;
}

export interface CommentFieldState {
  value: string;
  sanitized: string;
  characterCount: number;
  maxLength: number;
  warningThreshold: number;
  isOverWarning: boolean;
  isAtLimit: boolean;
  onChange: (value: string) => void;
  clear: () => void;
}

export interface UseCommentFieldsResult {
  status: CommentStatus;
  lastSavedAt: Date | null;
  error: Error | null;
  strength: CommentFieldState;
  improvement: CommentFieldState;
  flush: () => Promise<boolean>;
  clearDraft: () => void;
  resetError: () => void;
  getPayload: () => { strength: string; improvement: string };
}

function getStorageNamespace(storageKey: string) {
  return `${STORAGE_PREFIX}:${storageKey}`;
}

function clampLength(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
}

function normaliseForState(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return '';
  }
  return clampLength(value.replace(/\r/g, ''), maxLength);
}

function sanitiseForPersistence(value: string) {
  return value.replace(/\r/g, '').trim();
}

function readDraft(storageNamespace: string): StoredCommentDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageNamespace);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredCommentDraft> | null;

    return {
      strength: typeof parsed?.strength === 'string' ? parsed.strength : '',
      improvement: typeof parsed?.improvement === 'string' ? parsed.improvement : '',
      updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Failed to read comment draft from storage', error);
    return null;
  }
}

function writeDraft(storageNamespace: string, draft: StoredCommentDraft) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageNamespace, JSON.stringify(draft));
}

export function useCommentFields({
  storageKey,
  maxLength = DEFAULT_MAX_LENGTH,
  warningThreshold = DEFAULT_WARNING_THRESHOLD,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  initialStrength = '',
  initialImprovement = '',
  persist = true,
}: UseCommentFieldsOptions): UseCommentFieldsResult {
  const storageNamespace = getStorageNamespace(storageKey);
  const [strengthRaw, setStrengthRaw] = useState(() => normaliseForState(initialStrength, maxLength));
  const [improvementRaw, setImprovementRaw] = useState(() => normaliseForState(initialImprovement, maxLength));
  const [status, setStatus] = useState<CommentStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const hydratedRef = useRef(false);
  const savedSnapshotRef = useRef<{ strength: string; improvement: string }>({
    strength: sanitiseForPersistence(strengthRaw),
    improvement: sanitiseForPersistence(improvementRaw),
  });
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!persist) {
      hydratedRef.current = true;
      return;
    }

    const draft = readDraft(storageNamespace);
    if (draft) {
      const nextStrength = normaliseForState(draft.strength, maxLength);
      const nextImprovement = normaliseForState(draft.improvement, maxLength);
      setStrengthRaw(nextStrength);
      setImprovementRaw(nextImprovement);
      savedSnapshotRef.current = {
        strength: sanitiseForPersistence(nextStrength),
        improvement: sanitiseForPersistence(nextImprovement),
      };
      setLastSavedAt(new Date(draft.updatedAt));
      setStatus('saved');
    }
    hydratedRef.current = true;
  }, [maxLength, persist, storageNamespace]);

  useEffect(() => {
    if (!hydratedRef.current || !persist || typeof window === 'undefined') {
      return;
    }

    const sanitizedStrength = sanitiseForPersistence(strengthRaw);
    const sanitizedImprovement = sanitiseForPersistence(improvementRaw);
    const hasChanged =
      sanitizedStrength !== savedSnapshotRef.current.strength ||
      sanitizedImprovement !== savedSnapshotRef.current.improvement;

    if (!hasChanged) {
      return;
    }

    setStatus('dirty');
    setError(null);

    const timer = window.setTimeout(() => {
      try {
        setStatus('saving');
        const updatedAt = new Date();
        writeDraft(storageNamespace, {
          strength: sanitizedStrength,
          improvement: sanitizedImprovement,
          updatedAt: updatedAt.toISOString(),
        });
        savedSnapshotRef.current = {
          strength: sanitizedStrength,
          improvement: sanitizedImprovement,
        };
        setLastSavedAt(updatedAt);
        setStatus('saved');
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError : new Error('Failed to save judge comments.'));
        setStatus('error');
      }
    }, debounceMs);

    debounceRef.current = timer;

    return () => {
      window.clearTimeout(timer);
    };
  }, [debounceMs, improvementRaw, persist, storageNamespace, strengthRaw]);

  const updateField = useCallback(
    (key: CommentFieldKey, value: string) => {
      const nextValue = clampLength(value.replace(/\r/g, ''), maxLength);
      if (key === 'strength') {
        setStrengthRaw(nextValue);
      } else {
        setImprovementRaw(nextValue);
      }
    },
    [maxLength],
  );

  const clearField = useCallback((key: CommentFieldKey) => {
    if (key === 'strength') {
      setStrengthRaw('');
    } else {
      setImprovementRaw('');
    }
  }, []);

  const flush = useCallback(async () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const sanitizedStrength = sanitiseForPersistence(strengthRaw);
    const sanitizedImprovement = sanitiseForPersistence(improvementRaw);
    const hasChanged =
      sanitizedStrength !== savedSnapshotRef.current.strength ||
      sanitizedImprovement !== savedSnapshotRef.current.improvement;

    if (!hasChanged) {
      return true;
    }

    try {
      if (persist && typeof window !== 'undefined') {
        const updatedAt = new Date();
        setStatus('saving');
        writeDraft(storageNamespace, {
          strength: sanitizedStrength,
          improvement: sanitizedImprovement,
          updatedAt: updatedAt.toISOString(),
        });
        setLastSavedAt(updatedAt);
      } else {
        setStatus('saved');
        setLastSavedAt(new Date());
      }
      savedSnapshotRef.current = {
        strength: sanitizedStrength,
        improvement: sanitizedImprovement,
      };
      setStatus('saved');
      setError(null);
      return true;
    } catch (saveError) {
      const normalizedError = saveError instanceof Error ? saveError : new Error('Failed to save judge comments.');
      setError(normalizedError);
      setStatus('error');
      return false;
    }
  }, [improvementRaw, persist, storageNamespace, strengthRaw]);

  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageNamespace);
    }
    savedSnapshotRef.current = { strength: '', improvement: '' };
    setStrengthRaw('');
    setImprovementRaw('');
    setLastSavedAt(null);
    setStatus('idle');
    setError(null);
  }, [storageNamespace]);

  const resetError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('dirty');
    }
  }, [status]);

  const strength = useMemo<CommentFieldState>(
    () => ({
      value: strengthRaw,
      sanitized: sanitiseForPersistence(strengthRaw),
      characterCount: strengthRaw.length,
      maxLength,
      warningThreshold,
      isOverWarning: strengthRaw.length > warningThreshold,
      isAtLimit: strengthRaw.length >= maxLength,
      onChange: (value: string) => updateField('strength', value),
      clear: () => clearField('strength'),
    }),
    [clearField, maxLength, strengthRaw, updateField, warningThreshold],
  );

  const improvement = useMemo<CommentFieldState>(
    () => ({
      value: improvementRaw,
      sanitized: sanitiseForPersistence(improvementRaw),
      characterCount: improvementRaw.length,
      maxLength,
      warningThreshold,
      isOverWarning: improvementRaw.length > warningThreshold,
      isAtLimit: improvementRaw.length >= maxLength,
      onChange: (value: string) => updateField('improvement', value),
      clear: () => clearField('improvement'),
    }),
    [clearField, improvementRaw, maxLength, updateField, warningThreshold],
  );

  const getPayload = useCallback(
    () => ({
      strength: sanitiseForPersistence(strengthRaw),
      improvement: sanitiseForPersistence(improvementRaw),
    }),
    [improvementRaw, strengthRaw],
  );

  return {
    status,
    lastSavedAt,
    error,
    strength,
    improvement,
    flush,
    clearDraft,
    resetError,
    getPayload,
  };
}

export type { CommentStatus };
