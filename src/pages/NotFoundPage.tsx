import { Compass } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NotFoundPage() {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/20 text-brand-200">
          <Compass className="h-6 w-6" aria-hidden="true" />
        </div>
        <CardTitle>Page not found</CardTitle>
        <CardDescription>
          The destination you are looking for doesn&apos;t exist yet. Choose a section from the navigation below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-300">
          If you expected to see something here, double-check the URL or reach out to the operations crew.
        </p>
      </CardContent>
    </Card>
  );
}
