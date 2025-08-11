import { TransactionsCard } from "./TransactionsCard";
import { useUserData } from "../../hooks/useUserData";
import { CustomMessage } from "../Helpers";
import { useMemo, useState } from "react";
import { getFilteredData } from "../../utils/components";
import { DebouncedSearchInput } from "./DebouncedSearchInput";
import { usePopupStore } from "../../store/popup";
import { ChangeTransactionPopup } from "./ChangeTransactionPopup";

export function Transactions() {
    const { data } = useUserData();
    const [visibleCount, setVisibleCount] = useState(10);
    const [searchInput,] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    const handleLoadMore = () => {
        setVisibleCount((count) => count + 10);
    };

    const sortedData = useMemo(() => {
        return data ? [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
    }, [data]);

    const filteredData = useMemo(() => getFilteredData(sortedData, debouncedSearchQuery), [sortedData, debouncedSearchQuery]);

    const visibleData = useMemo(() => {
        return filteredData?.slice(0, visibleCount);
    }, [filteredData, visibleCount]);

    const { open } = usePopupStore();
    const handleOpenPopup = () => {
        return () => open("Add transaction", <ChangeTransactionPopup />);
    }

    return (
        <section className="w-full">
            <div className="flex justify-between max-[970px]:flex-col items-center gap-6 mb-[27px]">
                <h1 className="text-[var(--color-title)] text-[32px] font-semibold">Dashboard</h1>
                <div className="flex gap-3 max-[400px]:flex-col justify-center">
                    <DebouncedSearchInput searchQuery={searchInput} setDebouncedSearchQuery={setDebouncedSearchQuery} />
                    <button onClick={handleOpenPopup()} className="bg-[var(--color-card)] rounded-[10px] p-[10px] text-[var(--color-text)] border-1 border-[var(--color-fixed-text)] transitioned cursor-pointer hover:border-[var(--color-hover)] hover:text-[var(--color-hover)] hover:scale-95 text-[16px] font-bold">Add new</button>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                {visibleData && visibleData.length > 0
                    ? visibleData.map((item) => <TransactionsCard key={item.id} data={item} />)
                    : <CustomMessage message="No transactions" />
                }

                {visibleCount < (data?.length ?? 0) && (
                    <button
                        onClick={handleLoadMore}
                        className="mt-2 px-4 py-2 bg-[var(--color-hover)] text-[var(--color-fixed)] rounded hover:bg-[var(--color-hover-reverse)] hover:text-[var(--color-hover)] transitioned cursor-pointer"
                    >
                        Load more
                    </button>
                )}
            </div>
        </section>
    );
}