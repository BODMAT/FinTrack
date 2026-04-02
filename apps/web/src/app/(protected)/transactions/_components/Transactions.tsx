import { TransactionsCard } from "./TransactionsCard";
import { useAuth } from "@/hooks/useAuth";
import { CustomMessage } from "@/shared/ui/Helpers";
import { useState } from "react";
import { getFilteredData } from "@/utils/components";
import { DebouncedSearchInput } from "./DebouncedSearchInput";
import { usePopupStore } from "@/store/popup";
import { ChangeTransactionPopup } from "./ChangeTransactionPopup";
import { useIntersection } from "@/hooks/useIntersection";
import {
  useTransactionsAll,
  useTransactionsInfinite,
} from "@/hooks/useTransactions";
import type { ResponseTransaction } from "@fintrack/types";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

export function Transactions() {
  const { t } = useSafeTranslation();
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
    return () =>
      open(t("transactions.addTransactionTitle"), <ChangeTransactionPopup />);
  };

  if (!user) {
    return <CustomMessage message={t("transactions.notLoggedIn")} />;
  }
  return (
    <section className="w-full">
      <div className="flex justify-between max-[970px]:flex-col items-center gap-[24px] mb-[27px]">
        <h1 className="text-(--color-title) text-[32px] font-semibold">
          {t("transactions.title")}
        </h1>
        <div className="flex gap-[12px] max-[400px]:flex-col justify-center">
          <DebouncedSearchInput
            searchQuery={searchInput}
            setDebouncedSearchQuery={setDebouncedSearchQuery}
          />
          <button
            disabled={!user?.id}
            onClick={handleOpenPopup()}
            className="bg-(--color-card) rounded-[10px] p-[10px] text-(--color-text) border border-(--color-fixed-text) transitioned not-disabled:cursor-pointer not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover) not-disabled:hover:scale-95 text-[16px] font-bold"
          >
            {t("transactions.addNew")}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-[16px]">
        {/* input empty - data from infinity */}
        {user?.id && !debouncedSearchQuery && (
          <>
            {flatInfiniteData.map((item: ResponseTransaction) => (
              <TransactionsCard key={item.id} data={item} />
            ))}

            {hasNextPage && (
              <div ref={cursorRef} className="h-[16px] w-full">
                {isFetchingNextPage && (
                  <CustomMessage message={t("transactions.loadingMore")} />
                )}
              </div>
            )}

            {!hasNextPage && flatInfiniteData.length > 0 && (
              <CustomMessage message={t("transactions.noMore")} />
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
              <CustomMessage message={t("transactions.noFound")} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
