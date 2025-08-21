import { useCallback, useEffect } from "react";
import { useUser } from "../../hooks/useUser";
import { CustomMessage, NoData, Spinner } from "../Helpers";
import { analyzeData } from "../../api/ai";
import { motion } from "framer-motion";
import { useAIStore } from "../../store/AIResponse";
import { sanitizeText, toLocalDatetimeString } from "../../utils/components";
import { TypingText } from "./TypingText";
import { FixedPanel } from "../../portals/FixedPanel";
import { type Response } from "../../types/custom";

export function Analitycs() {
    const { user, isLoading, error } = useUser();
    const { prompt, response, loading, setPrompt, setResponse, setLoading } = useAIStore();

    const handleAnalyze = useCallback(async () => {
        setLoading(true);
        setPrompt("");
        try {
            if (!prompt || !user.data) return;
            const result = await analyzeData(user.data, prompt);
            setResponse(result, true);
        } catch (err) {
            console.error(err);
            setResponse("Something went wrong, please wait a few seconds", true);
        } finally {
            setLoading(false);
        }
    }, [prompt, user, setLoading, setPrompt, setResponse]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleAnalyze();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleAnalyze]);

    if (user.nickname === null) {
        return <CustomMessage message="You are not logged in. Please log in to see your analytics." />
    }
    if (isLoading) return <Spinner />;
    if (error) return <CustomMessage message="Something went wrong, please wait a few seconds" />;
    if (!user.data) return <NoData />;

    return (
        <section className="w-full ">
            <div className="relative">
                <h1 className="text-[var(--color-title)] transitioned text-[32px] font-semibold mb-6">Analytics</h1>
                <div>
                    {loading && <div className="h-30 w-30 overflow-hidden flex justify-center items-center mx-auto"><Spinner /></div>}
                    {response && [...response].reverse().map((item: Response, index) => {
                        const isNewest = index === 0;
                        return (
                            <motion.div key={item.id}
                                className="mt-6 text-[var(--color-text)] px-5 py-2 border-1 border-[var(--color-fixed-text)] rounded"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                {isNewest ? (
                                    <TypingText id={item.id} text={sanitizeText(item.content)} />
                                ) : (
                                    <>{sanitizeText(item.content)}</>
                                )}
                                <div className="w-full italic text-right mt-3 text-[var(--color-placeholder)]">
                                    {toLocalDatetimeString(new Date(item.date), true)}
                                </div>
                            </motion.div>
                        );
                    })}

                </div>
                <FixedPanel>
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="fixed z-3 bottom-5 left-[320px] w-[calc(100%-340px)] max-md:left-5 max-md:w-[calc(100%-40px)]
                       bg-[var(--color-card)]  rounded-2xl border-2 border-[var(--color-fixed-text)]
                       shadow-lg"
                    >
                        <div className="flex gap-6 my-2 mx-3 justify-between items-center">
                            <textarea
                                name="prompt"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="Ask me anything..."
                                id="prompt"
                                className="w-full max-h-48 h-12 rounded-[5px] p-3 placeholder:text-[var(--color-placeholder)]
                               text-[var(--color-text)] scrollable resize-none transitioned text-[16px] font-semibold
                               focus:outline-none"
                            />

                            <button
                                onClick={handleAnalyze}
                                type="button"
                                disabled={loading}
                                className="w-[120px] h-12 border-1 border-[var(--color-fixed-text)] rounded-[10px] p-3
                               text-[var(--color-text)] cursor-pointer transitioned
                               hover:bg-[var(--color-fixed-text)] hover:text-[var(--color-card)]
                               text-[16px] font-semibold"
                            >
                                Analyze
                            </button>
                        </div>
                    </motion.div>
                </FixedPanel>
            </div>
        </section>
    );
}
