import { TransactionsCard } from "./TransactionsCard";
import { useAuth } from "../../hooks/useAuth";
import { CustomMessage } from "../Helpers";
import { useState } from "react";
import { getFilteredData } from "../../utils/components";
import { DebouncedSearchInput } from "./DebouncedSearchInput";
import { usePopupStore } from "../../store/popup";
import { ChangeTransactionPopup } from "./ChangeTransactionPopup";
import { useIntersection } from "../../hooks/useIntersection";
import {
	useTransactionsAll,
	useTransactionsInfinite,
} from "../../hooks/useTransactions";
import type { ResponseTransaction } from "@fintrack/types";

export function Transactions() {
	const { user } = useAuth();
	const [searchInput] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

	const {
		fetchNextPage,
		data: infiniteTransactions,
		isFetchingNextPage,
		hasNextPage,
	} = useTransactionsInfinite({ perPage: 10, userId: user?.id });
	const flatInfiniteData =
		infiniteTransactions?.pages.flatMap((page) => page.data) ?? [];

	const { data: allTransactions } = useTransactionsAll({ userId: user?.id });

	const cursorRef = useIntersection(() => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	});

	const filteredData = getFilteredData(allTransactions, debouncedSearchQuery);
	const { open } = usePopupStore();
	const handleOpenPopup = () => {
		return () => open("Add transaction", <ChangeTransactionPopup />);
	};

	if (user?.id === null) {
		return (
			<CustomMessage message="You are not logged in. Please log in to see your transactions." />
		);
	}
	return (
		<section className="w-full">
			<div className="flex justify-between max-[970px]:flex-col items-center gap-6 mb-[27px]">
				<h1 className="text-[var(--color-title)] text-[32px] font-semibold">
					Transactions
				</h1>
				<div className="flex gap-3 max-[400px]:flex-col justify-center">
					<DebouncedSearchInput
						searchQuery={searchInput}
						setDebouncedSearchQuery={setDebouncedSearchQuery}
					/>
					<button
						onClick={handleOpenPopup()}
						className="bg-[var(--color-card)] rounded-[10px] p-[10px] text-[var(--color-text)] border-1 border-[var(--color-fixed-text)] transitioned cursor-pointer hover:border-[var(--color-hover)] hover:text-[var(--color-hover)] hover:scale-95 text-[16px] font-bold"
					>
						Add new
					</button>
				</div>
			</div>
			<div className="flex flex-col gap-4">
				{/* input empty - data from infinity */}
				{user?.id && !debouncedSearchQuery && (
					<>
						{flatInfiniteData.map((item: ResponseTransaction) => (
							<TransactionsCard key={item.id} data={item} />
						))}

						{hasNextPage && (
							<div ref={cursorRef} className="h-4 w-full">
								{isFetchingNextPage && (
									<CustomMessage message="Loading more..." />
								)}
							</div>
						)}

						{!hasNextPage && flatInfiniteData.length > 0 && (
							<CustomMessage message="No more transactions" />
						)}
					</>
				)}

				{/* has input - data from all (filtered) */}
				{debouncedSearchQuery && (
					<>
						{filteredData && filteredData.data.length > 0 ? (
							filteredData.data.map((item) => (
								<TransactionsCard key={item.id} data={item} />
							))
						) : (
							<CustomMessage message="No transactions found" />
						)}
					</>
				)}
			</div>
		</section>
	);
}
