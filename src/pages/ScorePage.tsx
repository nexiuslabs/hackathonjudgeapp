import { ArrowUpRight, UsersRound } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const queue = [
  { team: 'Nova Robotics', category: 'AI for Good', startsIn: '5 min' },
  { team: 'BloomSense', category: 'Sustainability', startsIn: '25 min' },
  { team: 'LedgerLoop', category: 'FinTech', startsIn: '50 min' },
];

export function ScorePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upcoming judging queue</CardTitle>
          <CardDescription>
            Prep your rubric before each team joins. Tap a team to open their workspace when the session begins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {queue.map((entry) => (
              <button
                key={entry.team}
                type="button"
                className="group flex flex-col gap-4 rounded-xl border border-surface-border/60 bg-surface-base/70 p-5 text-left transition hover:border-brand-400/60 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/80"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-400">{entry.category}</p>
                  <p className="text-lg font-semibold text-white">{entry.team}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-300">
                  <span className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4" aria-hidden="true" />
                    Panel ready
                  </span>
                  <span className="flex items-center gap-2 text-brand-200">
                    {entry.startsIn}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Score capture checklist</CardTitle>
          <CardDescription>
            Follow this flow to keep rubric entries consistent across judges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-neutral-200">
            <li className="flex gap-3 rounded-lg border border-surface-border/60 bg-surface-elevated/50 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 font-semibold text-brand-200">1</span>
              <div>
                <p className="font-medium text-white">Capture quick impressions</p>
                <p className="text-neutral-300">Log standout insights during the demo to speed up final scoring.</p>
              </div>
            </li>
            <li className="flex gap-3 rounded-lg border border-surface-border/60 bg-surface-elevated/50 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 font-semibold text-brand-200">2</span>
              <div>
                <p className="font-medium text-white">Score each pillar</p>
                <p className="text-neutral-300">Assign values for innovation, usability, technical depth, and storytelling.</p>
              </div>
            </li>
            <li className="flex gap-3 rounded-lg border border-surface-border/60 bg-surface-elevated/50 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 font-semibold text-brand-200">3</span>
              <div>
                <p className="font-medium text-white">Submit final notes</p>
                <p className="text-neutral-300">Highlight mentorship needs or standout differentiators for the operations team.</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
