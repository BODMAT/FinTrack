import { useEffect, useState, useRef } from "react";
import { useAnalitycsAI } from "../../hooks/useAnalitycsAI";

export function TypingText({ text, id }: { text: string; id: string }) {
    const [displayed, setDisplayed] = useState("");
    const { changeResponseToOld } = useAnalitycsAI();
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
                changeResponseToOld({ id });
            }
        }

        type();

        return () => {
            cancelled = true;
            if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
        };
    }, [text, id, changeResponseToOld]);

    return <>{displayed}</>;
}
