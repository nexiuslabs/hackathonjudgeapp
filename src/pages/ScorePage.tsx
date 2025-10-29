import { AlertCircle, BookOpen, CheckCircle2, RefreshCcw, ShieldQuestion } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { ScoreCriteriaList } from '@/components/score/ScoreCriteriaList';
import { CommentField } from '@/components/score/CommentField';
import type { ScoreFieldStatus } from '@/components/score/ScoreSliderCard';
import { ScoreSkeleton, ScoreStickyBarSkeleton } from '@/components/score/ScoreSkeleton';
import { ScoreStickyBar, type ScoreFormStatus } from '@/components/score/ScoreStickyBar';
import { UnlockRequestSheet } from '@/components/score/UnlockRequestSheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateWeightedTotal } from '@/lib/api';
import { useScoringCriteria } from '@/hooks/useScoringCriteria';
import { useCommentFields } from '@/hooks/useCommentFields';
import { useBallotLifecycle } from '@/hooks/useBallotLifecycle';

const EVENT_ID = 'demo-event';
const TEAM_ID = 'team-aurora';

export function ScorePage() {
  const { criteria, isLoading, error, isOffline, lastUpdated, refetch } = useScoringCriteria({ eventId: EVENT_ID });

  const [scores, setScores] = useState<Record<string, number | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [acknowledgement, setAcknowledgement] = useState<ReactNode>(null);
  const [isUnlockSheetOpen, setIsUnlockSheetOpen] = useState(false);
  const [unlockNote, setUnlockNote] = useState('');

  const lifecycle = useBallotLifecycle({ eventId: EVENT_ID, teamId: TEAM_ID });
  const {
    locked: commentsLocked,
    isSubmitting,
    submitBallot,
    requestUnlock,
    cancelUnlock,
    unlockRequest,
    queuedSubmission,
    lastSubmittedAt,
    isUnlocking,
    unlockRequestError,
  } = lifecycle;

  const previousLockRef = useRef(commentsLocked);
  const previousUnlockStatusRef = useRef(unlockRequest.status);

  const commentFields = useCommentFields({
    storageKey: `${EVENT_ID}:${TEAM_ID}`,
  });

  const criteriaSignature = useMemo(() => criteria.map((criterion) => criterion.id).join(':'), [criteria]);

  useEffect(() => {
    // Reset local state when the active criteria set changes.
    setScores({});
    setTouched({});
    setShowValidation(false);
  }, [criteriaSignature]);

  useEffect(() => {
    if (previousLockRef.current === commentsLocked) {
      return;
    }

    previousLockRef.current = commentsLocked;

    if (commentsLocked) {
      setAcknowledgement(
        <div className="flex flex-col gap-3">
          <p>
            {queuedSubmission || isOffline
              ? 'Scores queued while offline. They will sync automatically once you are reconnected.'
              : 'Scores ready! Submit to operations when the full panel confirms.'}
          </p>
          <p className="text-sm text-neutral-300">
            Comments are locked to preserve your submission. Request an unlock below if you need to make an adjustment.
          </p>
          <button
            type="button"
            className="self-start rounded-full border border-surface-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-200 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            onClick={() => setIsUnlockSheetOpen(true)}
          >
            Request unlock
          </button>
        </div>,
      );
    } else {
      setAcknowledgement('Unlock request approved. Comments are editable again. Remember to re-submit after editing.');
    }
  }, [commentsLocked, isOffline, queuedSubmission]);

  useEffect(() => {
    if (previousUnlockStatusRef.current === unlockRequest.status) {
      return;
    }

    previousUnlockStatusRef.current = unlockRequest.status;

    if (unlockRequest.status === 'pending') {
      setAcknowledgement(
        <div className="flex flex-col gap-2">
          <p>Unlock request pending. Operations will notify you once the ballot is released.</p>
          {unlockRequest.note ? (
            <p className="text-xs text-neutral-300">Shared note: “{unlockRequest.note}”</p>
          ) : null}
          <button
            type="button"
            className="self-start rounded-full border border-surface-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-200 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            onClick={() => cancelUnlock()}
          >
            Cancel request
          </button>
        </div>,
      );
    }

    if (unlockRequest.status === 'rejected') {
      setAcknowledgement(
        <div className="flex flex-col gap-2">
          <p>Unlock request denied. Contact the operations desk if you still need adjustments.</p>
          {unlockRequest.resolutionNote ? (
            <p className="text-xs text-neutral-300">Message from operations: “{unlockRequest.resolutionNote}”</p>
          ) : null}
        </div>,
      );
    }

    if (unlockRequest.status === 'idle' && commentsLocked) {
      setAcknowledgement(
        <div className="flex flex-col gap-3">
          <p>
            {queuedSubmission || isOffline
              ? 'Scores queued while offline. They will sync automatically once you are reconnected.'
              : 'Scores ready! Submit to operations when the full panel confirms.'}
          </p>
          <p className="text-sm text-neutral-300">
            Comments are locked to preserve your submission. Request an unlock below if you need to make an adjustment.
          </p>
          <button
            type="button"
            className="self-start rounded-full border border-surface-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-200 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            onClick={() => setIsUnlockSheetOpen(true)}
          >
            Request unlock
          </button>
        </div>,
      );
    }
  }, [cancelUnlock, commentsLocked, isOffline, queuedSubmission, unlockRequest.note, unlockRequest.resolutionNote, unlockRequest.status]);

  const statusMap = useMemo(() => {
    const map: Record<string, ScoreFieldStatus> = {};
    for (const criterion of criteria) {
      const hasValue = typeof scores[criterion.id] === 'number';
      const wasTouched = touched[criterion.id];
      if (hasValue) {
        map[criterion.id] = 'valid';
      } else if (wasTouched || showValidation) {
        map[criterion.id] = 'incomplete';
      } else {
        map[criterion.id] = 'pristine';
      }
    }
    return map;
  }, [criteria, scores, showValidation, touched]);

  const missingCount = useMemo(
    () =>
      criteria.reduce((count, criterion) => {
        return typeof scores[criterion.id] === 'number' ? count : count + 1;
      }, 0),
    [criteria, scores],
  );

  useEffect(() => {
    if (missingCount === 0) {
      setShowValidation(false);
    }
  }, [missingCount]);

  const total = useMemo(
    () => calculateWeightedTotal(criteria, scores, { precision: 1, scale: 100 }),
    [criteria, scores],
  );

  const formStatus: ScoreFormStatus = isSubmitting
    ? 'pending'
    : commentsLocked
      ? 'locked'
      : missingCount === 0
        ? 'ready'
        : 'incomplete';

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores((previous) => ({ ...previous, [criterionId]: value }));
    setTouched((previous) => ({ ...previous, [criterionId]: true }));
  };

  const handleFirstInteraction = (criterionId: string) => {
    setTouched((previous) => ({ ...previous, [criterionId]: true }));
  };

  const handleSubmit = async () => {
    if (missingCount > 0) {
      setShowValidation(true);
      setAcknowledgement('Make sure each slider has a value before submitting.');
      return;
    }

    setAcknowledgement(null);

    const draftSaved = await commentFields.flush();
    if (!draftSaved) {
      setAcknowledgement(
        'We were unable to lock your comments. Check your connection and try again before submitting.',
      );
      return;
    }

    const payloadScores: Record<string, number> = {};
    for (const criterion of criteria) {
      const scoreValue = scores[criterion.id];
      if (typeof scoreValue === 'number') {
        payloadScores[criterion.id] = scoreValue;
      }
    }

    try {
      const result = await submitBallot({
        scores: payloadScores,
        comments: commentFields.getPayload(),
      });

      setAcknowledgement(
        <div className="flex flex-col gap-3">
          <p>
            {result === 'queued' || queuedSubmission || isOffline
              ? 'Scores queued while offline. They will sync automatically once you are reconnected.'
              : 'Scores ready! Submit to operations when the full panel confirms.'}
          </p>
          <p className="text-sm text-neutral-300">
            Comments are locked to preserve your submission. Request an unlock below if you need to make an adjustment.
          </p>
          <button
            type="button"
            className="self-start rounded-full border border-surface-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-200 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            onClick={() => setIsUnlockSheetOpen(true)}
          >
            Request unlock
          </button>
        </div>,
      );
    } catch (error) {
      console.error('Failed to submit ballot', error);
      setAcknowledgement('We could not submit your scores. Please try again.');
    }
  };

  const handleSaveDraft = () => {
    void commentFields.flush().then((success) => {
      setAcknowledgement(
        success
          ? 'Progress saved locally. You can return to finish scoring anytime.'
          : 'We could not save your progress. Please check your connection.',
      );
    });
  };

  const onboardingHighlights = [
    {
      title: 'Start with the judging brief',
      body: 'Review each criterion definition before the pitch begins so your first slider move is intentional.',
      icon: BookOpen,
    },
    {
      title: 'Score with confidence',
      body: 'Sliders use 1–10 steps. Drag or use the arrow keys; the total updates instantly with official weighting.',
      icon: CheckCircle2,
    },
    {
      title: 'Need clarification?',
      body: 'Tap retry below if metadata fails to load or flag the ops team using the help desk button.',
      icon: ShieldQuestion,
    },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 pb-32">
      <a href="#score-submit" className="sr-only focus:not-sr-only focus:rounded-full focus:bg-brand-500/20 focus:px-4 focus:py-2 focus:text-white">
        Skip to submit controls
      </a>
      <Card>
        <CardHeader>
          <CardTitle>Scoring workspace</CardTitle>
          <CardDescription>
            {`You are scoring ${TEAM_ID}. Every slider requires an intentional adjustment before submission.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4 md:grid-cols-3">
            {onboardingHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.title}
                  className="flex h-full flex-col gap-2 rounded-xl border border-surface-border/70 bg-surface-base/60 p-4"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15 text-brand-200">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-neutral-300">{item.body}</p>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">We could not refresh the scoring criteria.</p>
              <p className="mt-1 text-red-100/80">
                Your offline snapshot is displayed below. Reconnect or retry to pull the latest weights and helper copy.
              </p>
              <button
                type="button"
                onClick={refetch}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-300/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-100 transition hover:border-red-200/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Retry loading
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <ScoreSkeleton />
      ) : (
        <>
          <ScoreCriteriaList
            criteria={criteria}
            scores={scores}
            statusMap={statusMap}
            onScoreChange={handleScoreChange}
            onFirstInteraction={handleFirstInteraction}
          />

          <section aria-labelledby="comment-section-title" className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 id="comment-section-title" className="text-lg font-semibold text-white">
                Optional judge comments
              </h2>
              <p className="text-sm text-neutral-300">
                Share one quick win and one opportunity to improve. Notes stay private to operations and help finalists
                understand their next steps.
              </p>
            </div>
            <div className="grid gap-4">
              <CommentField
                label="Strengths to celebrate"
                name="commentStrength"
                value={commentFields.strength.value}
                onChange={commentFields.strength.onChange}
                helperText="What resonated most about this team’s approach? Highlight a specific moment, insight, or capability."
                placeholder="Example: Their customer discovery was exhaustive and clearly informed the product roadmap."
                characterCount={commentFields.strength.characterCount}
                maxLength={commentFields.strength.maxLength}
                warningThreshold={commentFields.strength.warningThreshold}
                autosaveStatus={commentFields.status}
                lastSavedAt={commentFields.lastSavedAt}
                autosaveError={commentFields.error?.message ?? null}
                validationMessage={
                  commentFields.strength.isAtLimit
                    ? 'Maximum length reached (1000 characters). Try trimming before adding more.'
                    : null
                }
                disabled={commentsLocked}
                readOnlyMessage="Submission locked. Request unlock to make edits."
              />
              <CommentField
                label="Improvements to consider"
                name="commentImprovement"
                value={commentFields.improvement.value}
                onChange={commentFields.improvement.onChange}
                helperText="Where could this team sharpen their story or execution before the next round? Offer actionable feedback."
                placeholder="Example: Focus the demo on real user impact before diving into roadmap milestones."
                characterCount={commentFields.improvement.characterCount}
                maxLength={commentFields.improvement.maxLength}
                warningThreshold={commentFields.improvement.warningThreshold}
                autosaveStatus={commentFields.status}
                lastSavedAt={commentFields.lastSavedAt}
                autosaveError={commentFields.error?.message ?? null}
                validationMessage={
                  commentFields.improvement.isAtLimit
                    ? 'Maximum length reached (1000 characters). Try trimming before adding more.'
                    : null
                }
                disabled={commentsLocked}
                readOnlyMessage="Submission locked. Request unlock to make edits."
              />
            </div>
          </section>
        </>
      )}

      {acknowledgement ? (
        <div className="rounded-2xl border border-brand-400/40 bg-brand-500/10 p-4 text-sm text-brand-100">
          {acknowledgement}
        </div>
      ) : null}

      <UnlockRequestSheet
        open={isUnlockSheetOpen}
        note={unlockNote}
        onNoteChange={setUnlockNote}
        onClose={() => {
          setIsUnlockSheetOpen(false);
          setUnlockNote('');
        }}
        onSubmit={async () => {
          try {
            await requestUnlock(unlockNote);
            setAcknowledgement(
              <div className="flex flex-col gap-2">
                <p>Unlock request pending. Operations will notify you once the ballot is released.</p>
                {unlockNote.trim() ? (
                  <p className="text-xs text-neutral-300">Shared note: “{unlockNote.trim()}”</p>
                ) : null}
                <button
                  type="button"
                  className="self-start rounded-full border border-surface-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-200 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  onClick={() => cancelUnlock()}
                >
                  Cancel request
                </button>
              </div>,
            );
            setUnlockNote('');
            setIsUnlockSheetOpen(false);
          } catch (error) {
            console.error('Failed to request unlock', error);
          }
        }}
        isSubmitting={isUnlocking}
        errorMessage={unlockRequestError}
      />

      <div id="score-submit" aria-live="polite" aria-atomic="true" className="sr-only">
        {formStatus === 'ready' ? 'All criteria scored. Submit when you are ready.' : 'Scoring incomplete.'}
      </div>

      {isLoading ? (
        <ScoreStickyBarSkeleton />
      ) : (
        <ScoreStickyBar
          total={total}
          missingCount={missingCount}
          status={formStatus}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          lastUpdated={commentFields.lastSavedAt ?? lastSubmittedAt ?? lastUpdated}
          isOffline={isOffline}
        />
      )}
    </div>
  );
}
