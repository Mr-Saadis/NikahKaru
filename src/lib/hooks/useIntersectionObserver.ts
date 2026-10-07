import { useEffect, useRef, useState, RefObject } from 'react';

export function useIntersectionObserver(
  ref: RefObject<Element | null>,
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '100px' }
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref, options.threshold, options.rootMargin, options.root]);

  return isIntersecting;
}
