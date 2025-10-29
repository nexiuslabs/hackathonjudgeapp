import { CalendarDays, MessageSquareHeart, Target } from 'lucide-react';

import { offlineBriefSnapshot } from '@/config/offline-content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function BriefPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event briefing</CardTitle>
          <CardDescription>
            Stay aligned with the hackathon focus areas even when offline. This cached snapshot refreshes once you reconnect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg bg-surface-highlight/40 p-4">
              <Target className="mt-1 h-5 w-5 text-brand-300" aria-hidden="true" />
              <div>
                <p className="font-medium text-white">Judging priorities</p>
                <p className="text-sm text-neutral-300">
                  Innovation, usability, and technical depth guide scoring. Storytelling ensures teams communicate their impact.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-surface-highlight/40 p-4">
              <CalendarDays className="mt-1 h-5 w-5 text-brand-300" aria-hidden="true" />
              <div>
                <p className="font-medium text-white">Schedule</p>
                <p className="text-sm text-neutral-300">
                  Pitch reviews run every 20 minutes with five minutes for deliberation. Use the Admin tab for real-time updates.
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-neutral-200">
            {offlineBriefSnapshot.summary}
          </p>
          <ul className="space-y-3" aria-label="Offline judging tips">
            {offlineBriefSnapshot.tips.map((tip) => (
              <li key={tip.id} className="flex gap-3 rounded-lg border border-surface-border/60 bg-surface-base/70 p-4">
                <MessageSquareHeart className="mt-1 h-5 w-5 text-brand-300" aria-hidden="true" />
                <div>
                  <p className="font-medium text-white">{tip.label}</p>
                  <p className="text-sm text-neutral-300">{tip.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
