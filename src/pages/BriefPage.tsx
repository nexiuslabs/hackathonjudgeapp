import { useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import {
  BriefAnchorNav,
  BriefHero,
  CriteriaSection,
  OverviewSection,
  RosterSection,
  SupportSection,
  TimelineSection,
  useSectionObserver,
} from '@/components/brief';

const sectionOrder = [
  { id: 'overview', label: 'Overview' },
  { id: 'criteria', label: 'Criteria' },
  { id: 'flow', label: 'Flow' },
  { id: 'judges', label: 'Judges' },
  { id: 'finalists', label: 'Finalists' },
  { id: 'support', label: 'Support' },
] as const;

export function BriefPage() {
  const location = useLocation();
  const sectionIds = useMemo(() => sectionOrder.map((section) => section.id), []);
  const activeSectionId = useSectionObserver(sectionIds);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) {
      return;
    }

    const matchedSection = sectionIds.find((sectionId) => sectionId === hash);
    if (!matchedSection) {
      return;
    }

    const element = document.getElementById(matchedSection);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, sectionIds]);

  useEffect(() => {
    if (!activeSectionId) return;
    const newUrl = `${window.location.pathname}${window.location.search}#${activeSectionId}`;
    if (`${window.location.hash}` !== `#${activeSectionId}`) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [activeSectionId]);

  const handleAnchorSelect = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const newUrl = `${window.location.pathname}${window.location.search}#${id}`;
    window.history.replaceState(null, '', newUrl);
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="space-y-8">
      <BriefHero />
      <BriefAnchorNav
        sections={sectionOrder.map((section) => ({ ...section }))}
        activeSectionId={activeSectionId}
        onSelect={handleAnchorSelect}
      />
      <div className="space-y-8">
        <OverviewSection />
        <CriteriaSection />
        <TimelineSection />
        <RosterSection id="judges" title="Judging roster" description="Meet today’s panel." />
        <RosterSection id="finalists" title="Finalist teams" description="Preview each team’s focus area." />
        <SupportSection />
      </div>
    </div>
  );
}
