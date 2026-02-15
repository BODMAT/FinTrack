import { useCallback, useRef, useEffect } from "react";

export function useIntersection(onIntersect: () => void) {
  const onIntersectRef = useRef(onIntersect);
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  const unsubscribe = useRef(() => {});

  return useCallback((el: HTMLElement | null) => {
    unsubscribe.current();

    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((intersection) => {
        if (intersection.isIntersecting) {
          onIntersectRef.current();
        }
      });
    });

    observer.observe(el);
    unsubscribe.current = () => observer.disconnect();
  }, []);
}
