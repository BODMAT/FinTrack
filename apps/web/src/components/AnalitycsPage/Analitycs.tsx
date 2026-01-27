import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { CustomMessage, NoData, Spinner } from "../Helpers";
import { motion } from "framer-motion";
import { sanitizeText, toLocalDatetimeString } from "../../utils/components";
import { TypingText } from "./TypingText";
import { FixedPanel } from "../../portals/FixedPanel";
import { useAnalitycsAI } from "../../hooks/useAnalitycsAI";
import { useTransactionsAll } from "../../hooks/useTransactions";
import type { AIResponseWithDiff } from "../../types/ai";

export function Analitycs() {
	const [prompt, setPrompt] = useState<string>("");
	const { user, isLoading } = useAuth();

	const {
		data: transactionData,
		isLoading: isLoadingTransactions,
		error,
	} = useTransactionsAll({ userId: user?.id });

	const { history, isLoading: isLoadingAI, getResponse } = useAnalitycsAI();

	const handleAnalyze = useCallback(() => {
		if (!prompt || !transactionData?.data.length) return;
		const transactions = transactionData.data;
		getResponse({
			prompt,
			data: { transactions },
			model: "openai/gpt-oss-120b:cerebras",
		});
		setPrompt("");
	}, [prompt, transactionData, getResponse]);

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

	if (isLoading || isLoadingTransactions) return <Spinner />;
	if (!user) return <CustomMessage message="You are not logged in..." />;
	if (error) return <CustomMessage message="Something went wrong..." />;
	if (!transactionData) return <NoData />;

	return (
		<section className="w-full">
			<div className="relative">
				<h1 className="text-[var(--color-title)] transitioned text-[32px] font-semibold mb-6">
					Analytics
				</h1>

				{isLoadingAI && (
					<div className="h-30 w-30 overflow-hidden flex justify-center items-center mx-auto">
						<Spinner />
					</div>
				)}

				{history.map((item: AIResponseWithDiff, index) => {
					const isRecent =
						Math.abs(
							new Date().getTime() -
								new Date(item.getted_at).getTime(),
						) < 60000;
					return (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.1 }}
						>
							<div className="mt-6 text-[var(--color-text)] px-5 py-2 border-1 border-[var(--color-fixed-text)] rounded max-w-[70%] max-sm:max-w-full w-fit items-end ml-auto flex flex-col justify-end">
								<div className="flex flex-row-reverse items-center gap-3">
									{user.photo_url && (
										<img
											src={user.photo_url}
											className="w-8 h-8 rounded-full"
											alt={user.name || "User"}
										/>
									)}
									<div>{item.prompt}</div>
								</div>
								<div className="w-full italic text-right mt-3 text-[var(--color-placeholder)]">
									{toLocalDatetimeString(
										item.getted_at,
										true,
									)}
								</div>
							</div>
							<div className="mt-6 text-[var(--color-text)] px-5 py-2 border-1 border-[var(--color-fixed-text)] rounded max-w-[70%] max-sm:max-w-full">
								{index === 0 && isRecent ? (
									<TypingText
										id={item.id}
										text={sanitizeText(item.result)}
									/>
								) : (
									<>{sanitizeText(item.result)}</>
								)}
								<div className="w-full italic text-right mt-3 text-[var(--color-placeholder)]">
									{toLocalDatetimeString(
										item.getted_at,
										true,
									)}
								</div>
							</div>
						</motion.div>
					);
				})}

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
								onChange={(e) => setPrompt(e.target.value)}
								placeholder="Ask me anything..."
								id="prompt"
								className="w-full max-h-48 h-12 rounded-[5px] p-3 placeholder:text-[var(--color-placeholder)]
                                text-[var(--color-text)] scrollable resize-none transitioned text-[16px] font-semibold
                                focus:outline-none"
							/>

							<button
								onClick={handleAnalyze}
								type="button"
								disabled={isLoadingAI}
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
