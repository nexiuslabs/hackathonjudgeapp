import { useEffect, useState } from 'react';

export function useSectionObserver(sectionIds: string[]) {
  const [activeSectionId, setActiveSectionId] = useState<string>(sectionIds[0] ?? '');

  useEffect(() => {
    if (sectionIds.length === 0) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setActiveSectionId(sectionIds[0]!);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? -1 : 1));

        if (visibleEntries.length > 0) {
          setActiveSectionId(visibleEntries[0]!.target.id);
          return;
        }

        const firstEntry = entries.sort((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? -1 : 1))[0];
        if (firstEntry) {
          setActiveSectionId(firstEntry.target.id);
        }
      },
      {
        rootMargin: '-40% 0px -40% 0px',
        threshold: [0.2, 0.5, 1],
      }
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  return activeSectionId;
}
