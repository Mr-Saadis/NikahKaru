import { useEffect, useState, RefObject } from 'react';

export function useScrollSpy(
  containerRef: RefObject<HTMLElement | null>,
  sectionSelector: string,
  dependencies: any[] = []
) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const sections = Array.from(container.querySelectorAll(sectionSelector)) as HTMLElement[];
      if (!sections.length) return;

      const containerRect = container.getBoundingClientRect();
      const threshold = containerRect.top + Math.min(170, container.clientHeight * 0.35);

      let active = 0;
      sections.forEach((sec, i) => {
        if (sec.getBoundingClientRect().top <= threshold) {
          active = i;
        }
      });

      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
        active = sections.length - 1;
      }

      setActiveIndex(active);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, sectionSelector, ...dependencies]);

  return activeIndex;
}
