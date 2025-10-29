import { Headset, Mail, Phone } from 'lucide-react';

import { BriefSection } from './BriefSection';

import { offlineBriefSnapshot } from '@/config/offline-content';

const contactIconMap = {
  slack: Headset,
  email: Mail,
  phone: Phone,
} as const;

export function SupportSection() {
  return (
    <BriefSection
      id="support"
      title="Support contacts"
      description="Need help on-site or remote? Reach out using the preferred channel below."
    >
      <ul className="space-y-3">
        {offlineBriefSnapshot.contacts.map((contact) => {
          const Icon = contactIconMap[contact.method];
          return (
            <li
              key={contact.id}
              className="flex items-start gap-3 rounded-xl border border-surface-border/60 bg-surface-base/80 p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-200">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{contact.label}</p>
                <p className="text-sm text-neutral-300">{contact.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </BriefSection>
  );
}
