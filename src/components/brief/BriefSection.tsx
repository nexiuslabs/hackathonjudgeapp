import { type PropsWithChildren } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BriefSectionProps extends PropsWithChildren {
  id: string;
  title: string;
  description?: string;
}

export function BriefSection({ id, title, description, children }: BriefSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28">
      <Card>
        <CardHeader>
          <CardTitle id={`${id}-title`}>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
