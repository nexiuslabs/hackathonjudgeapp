import { ArrowLeftCircle, MailWarning, ShieldOff, UserRoundX } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AdminAccessDenied() {
  return (
    <div className="py-12">
      <Card className="mx-auto max-w-2xl bg-surface-elevated/90">
        <CardHeader className="space-y-4">
          <Badge variant="danger" className="w-fit">Restricted area</Badge>
          <CardTitle className="flex items-center gap-3 text-2xl text-white">
            <ShieldOff className="h-6 w-6 text-rose-200" aria-hidden="true" />
            Admin access required
          </CardTitle>
          <CardDescription>
            Your current session does not include the head judge or operations role needed to open the admin console. The
            judging workspace remains available while you wait for elevated access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-neutral-200">
          <ol className="space-y-4">
            <li className="flex gap-3">
              <ArrowLeftCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-400" aria-hidden="true" />
              <span>
                <strong>Return to scoring:</strong> Continue reviewing teams in the scoring workspace. Your progress remains
                synced and offline-ready.
              </span>
            </li>
            <li className="flex gap-3">
              <MailWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-400" aria-hidden="true" />
              <span>
                <strong>Request access:</strong> Ping the operations desk or head judge so they can assign the appropriate role
                to your account.
              </span>
            </li>
            <li className="flex gap-3">
              <UserRoundX className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-400" aria-hidden="true" />
              <span>
                <strong>Switch profiles:</strong> If you received multiple credentials, sign out and log back in with the admin
                email or PIN.
              </span>
            </li>
          </ol>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/score"
              className="inline-flex items-center gap-2 rounded-full border border-surface-border/70 bg-surface-base/80 px-4 py-2 text-sm font-medium text-white transition hover:border-brand-400/70 hover:text-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <ArrowLeftCircle className="h-4 w-4" aria-hidden="true" />
              Back to scoring
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full border border-surface-border/70 bg-surface-highlight/60 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:border-brand-400/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              Manage access
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
