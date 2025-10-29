import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScorePage } from '@/pages/ScorePage';
import { resolveUnlockRequest, resetBallotLifecycle } from '@/lib/ballot-lifecycle';
import type { ScoringCriterion } from '@/types/scoring';

const mockRefetch = vi.fn(async () => {});

const criteriaFixture: ScoringCriterion[] = [
  {
    id: 'innovation',
    label: 'Innovation',
    helperText: 'Novelty of the solution.',
    weight: 0.3,
    order: 0,
    minScore: 1,
    maxScore: 10,
  },
  {
    id: 'ux',
    label: 'User experience',
    helperText: 'Quality of the interface.',
    weight: 0.3,
    order: 1,
    minScore: 1,
    maxScore: 10,
  },
  {
    id: 'technical',
    label: 'Technical depth',
    helperText: 'Engineering strength.',
    weight: 0.3,
    order: 2,
    minScore: 1,
    maxScore: 10,
  },
  {
    id: 'story',
    label: 'Storytelling',
    helperText: 'Narrative quality.',
    weight: 0.1,
    order: 3,
    minScore: 1,
    maxScore: 10,
  },
];

vi.mock('@/hooks/useScoringCriteria', () => ({
  useScoringCriteria: vi.fn(),
}));

const { useScoringCriteria } = await import('@/hooks/useScoringCriteria');
const mockedUseScoringCriteria = vi.mocked(useScoringCriteria);

describe('<ScorePage />', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBallotLifecycle('demo-event', 'team-aurora');
    mockRefetch.mockReset();
    mockedUseScoringCriteria.mockReturnValue({
      criteria: criteriaFixture,
      isLoading: false,
      error: null,
      isOffline: false,
      lastUpdated: new Date('2024-02-01T12:00:00Z'),
      hasCachedSnapshot: false,
      source: 'network',
      refetch: mockRefetch,
    });
  });


  it('renders sliders for each scoring criterion and updates the total', async () => {
    render(<ScorePage />);

    const innovationSlider = screen.getByRole('slider', { name: /innovation/i });
    const uxSlider = screen.getByRole('slider', { name: /user experience/i });
    const technicalSlider = screen.getByRole('slider', { name: /technical depth/i });
    const storySlider = screen.getByRole('slider', { name: /storytelling/i });

    fireEvent.change(innovationSlider, { target: { value: '10' } });
    fireEvent.change(uxSlider, { target: { value: '10' } });
    fireEvent.change(technicalSlider, { target: { value: '10' } });
    fireEvent.change(storySlider, { target: { value: '10' } });

    expect(screen.getByText(/Total 100\.0 \/ 100/)).toBeInTheDocument();
  });

  it('prevents submission until all sliders are scored', async () => {
    const user = userEvent.setup();
    render(<ScorePage />);

    const submitButton = screen.getByRole('button', { name: /submit scores/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText(/Choose a score before submitting./i)).toHaveLength(
        criteriaFixture.length,
      );
    });
  });

  it('autosaves comment drafts to local storage with trimmed content', async () => {
    const user = userEvent.setup();
    render(<ScorePage />);

    const strengthField = screen.getByLabelText(/strengths to celebrate/i);
    await user.type(strengthField, '  Incredible focus   ');

    expect(strengthField).toHaveValue('  Incredible focus   ');

    await waitFor(() => {
      const stored = window.localStorage.getItem('hackathonjudgeapp.commentDraft:demo-event:team-aurora');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored ?? '{}');
      expect(parsed.strength).toBe('Incredible focus');
      expect(parsed.improvement).toBe('');
    });
  });

  it('locks comment fields after submission until operations approves an unlock', async () => {
    const user = userEvent.setup();
    render(<ScorePage />);

    const sliders = screen.getAllByRole('slider');
    for (const slider of sliders) {
      fireEvent.change(slider, { target: { value: '10' } });
    }

    const improvementField = screen.getByLabelText(/improvements to consider/i);
    await user.type(improvementField, 'Polish the narrative arc.');

    const submitButton = screen.getByRole('button', { name: /submit scores/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(improvementField).toBeDisabled();
    });

    const requestButton = await screen.findByRole('button', { name: /request unlock/i });
    await user.click(requestButton);

    const noteField = await screen.findByLabelText(/optional note for operations/i);
    await user.type(noteField, 'Need to adjust a detail.');

    const sendButton = screen.getByRole('button', { name: /send unlock request/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Unlock request pending/i)).toBeInTheDocument();
    });

    await act(async () => {
      resolveUnlockRequest('demo-event', 'team-aurora', { status: 'approved' });
    });

    await waitFor(() => {
      expect(improvementField).not.toBeDisabled();
    });

    expect(screen.getByText(/Unlock request approved/i)).toBeInTheDocument();
  });
});
