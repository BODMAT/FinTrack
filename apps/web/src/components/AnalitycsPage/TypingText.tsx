import { useEffect, useState, useRef } from "react";

export function TypingText({ text, id }: { text: string; id: string }) {
	const [displayed, setDisplayed] = useState("");
	const timeoutRef = useRef<number | null>(null);

	useEffect(() => {
		const chars = Array.from(text ?? "");
		setDisplayed("");
		let isCancelled = false;

		async function type() {
			for (let i = 0; i < chars.length; i++) {
				if (isCancelled) break;

				setDisplayed((prev) => prev + chars[i]);

				await new Promise((resolve) => {
					timeoutRef.current = window.setTimeout(resolve, 20);
				});
			}
		}

		type();

		return () => {
			isCancelled = true;
			if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
		};
	}, [text, id]);

	return <>{displayed}</>;
}
