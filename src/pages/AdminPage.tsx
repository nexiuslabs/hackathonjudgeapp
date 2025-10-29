import { BellRing, CloudFog, RefreshCw } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { appMetadata } from '@/config/app-metadata';
import { buildInfo } from '@/lib/build-info';

export function AdminPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operations center</CardTitle>
          <CardDescription>
            Coordinate judge rotations, manage offline sync, and monitor announcements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-surface-border/60 bg-surface-base/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <BellRing className="h-4 w-4 text-brand-300" aria-hidden="true" />
                Live announcements
              </div>
              <p className="mt-2 text-sm text-neutral-300">
                Draft announcements will surface here. Hook this card up to your CMS or Supabase channel when ready.
              </p>
            </div>
            <div className="rounded-xl border border-surface-border/60 bg-surface-base/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <CloudFog className="h-4 w-4 text-brand-300" aria-hidden="true" />
                Offline snapshot
              </div>
              <p className="mt-2 text-sm text-neutral-300">
                Current cache: <span className="font-medium text-white">{appMetadata.offlineSnapshotName}.json</span>
              </p>
              {buildInfo.readable && (
                <p className="text-xs text-neutral-400">Generated on {buildInfo.readable}</p>
              )}
            </div>
            <div className="rounded-xl border border-surface-border/60 bg-surface-base/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <RefreshCw className="h-4 w-4 text-brand-300" aria-hidden="true" />
                Service worker
              </div>
              <p className="mt-2 text-sm text-neutral-300">
                Deploying a new build automatically prompts clients to refresh thanks to our auto-update strategy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
