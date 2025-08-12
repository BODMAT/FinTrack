import { useEffect, useState, useRef } from "react";
import { useAIStore } from "../../store/AIResponse";

export function TypingText({ text, id }: { text: string; id: number }) {
    const [displayed, setDisplayed] = useState("");
    const changeToOld = useAIStore(state => state.changeToOld);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const chars = Array.from(text ?? "");
        setDisplayed("");
        let cancelled = false;

        async function type() {
            for (let i = 0; i < chars.length; i++) {
                if (cancelled) break;

                setDisplayed(prev => prev + chars[i]);

                await new Promise(resolve => {
                    timeoutRef.current = window.setTimeout(resolve, 20);
                });
            }

            if (!cancelled) {
                changeToOld(id);
            }
        }

        type();

        return () => {
            cancelled = true;
            if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
        };
    }, [text, id, changeToOld]);

    return <>{displayed}</>;
}
