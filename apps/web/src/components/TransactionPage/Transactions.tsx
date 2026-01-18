// import { TransactionsCard } from "./TransactionsCard";
// import { useAuth } from "../../hooks/useAuth";
// import { CustomMessage } from "../Helpers";
// import { useState } from "react";
// import { getFilteredData } from "../../utils/components";
// import { DebouncedSearchInput } from "./DebouncedSearchInput";
// import { usePopupStore } from "../../store/popup";
// import { ChangeTransactionPopup } from "./ChangeTransactionPopup";
// import { useIntersection } from "../../hooks/useIntersection";
// import { useInfinityUserData } from "../../hooks/useInfiniteUserData";

// export function Transactions() {
//     const { user } = useAuth();
//     const [searchInput] = useState("");
//     const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
//     // console.log(user?.data);

//     const { fetchNextPage, data, isFetchingNextPage, hasNextPage } = useInfinityUserData();

//     const cursorRef = useIntersection(() => {
//         fetchNextPage();
//     });

//     const filteredData = getFilteredData(user?.data ?? [], debouncedSearchQuery);
//     const { open } = usePopupStore();
//     const handleOpenPopup = () => {
//         return () => open("Add transaction", <ChangeTransactionPopup />);
//     }

//     if (user?.nickname === null) {
//         return <CustomMessage message="You are not logged in. Please log in to see your transactions." />
//     }
//     return (
//         <section className="w-full">
//             <div className="flex justify-between max-[970px]:flex-col items-center gap-6 mb-[27px]">
//                 <h1 className="text-[var(--color-title)] text-[32px] font-semibold">Transactions</h1>
//                 <div className="flex gap-3 max-[400px]:flex-col justify-center">
//                     <DebouncedSearchInput searchQuery={searchInput} setDebouncedSearchQuery={setDebouncedSearchQuery} />
//                     <button onClick={handleOpenPopup()} className="bg-[var(--color-card)] rounded-[10px] p-[10px] text-[var(--color-text)] border-1 border-[var(--color-fixed-text)] transitioned cursor-pointer hover:border-[var(--color-hover)] hover:text-[var(--color-hover)] hover:scale-95 text-[16px] font-bold">Add new</button>
//                 </div>
//             </div>
//             <div className="flex flex-col gap-4">
//                 {/* input empty - data from infinity */}
//                 {user?.nickname && !debouncedSearchQuery && data && (
//                     <>
//                         {data.map((item) => item && <TransactionsCard key={item.id} data={item} />)}
//                         {data?.length > 0 && <div ref={cursorRef}></div>}
//                         {isFetchingNextPage && <CustomMessage message="Loading..." />}
//                         {!hasNextPage && <CustomMessage message="No more transactions" />}
//                     </>
//                 )}

//                 {/* has input - data from user (filtered) */}
//                 {debouncedSearchQuery && (
//                     filteredData
//                         ? filteredData.map((item) => <TransactionsCard key={item.id} data={item} />)
//                         : <CustomMessage message="No transactions" />
//                 )}
//             </div>
//         </section>
//     );
// }

export function Transactions() {
	return null;
}
