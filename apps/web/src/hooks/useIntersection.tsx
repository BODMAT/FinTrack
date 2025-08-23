import { useCallback, useRef } from "react";

export function useIntersecrion(onIntersect: () => void) {
    const unsubscribe = useRef(() => { });
    return useCallback((el: HTMLElement | null) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((intersection) => {
                if (intersection.isIntersecting) {
                    onIntersect();
                }
            })
        })

        if (el) {
            observer.observe(el);
            unsubscribe.current = () => observer.disconnect();
        } else {
            observer.disconnect();
        }
    }, [])
}