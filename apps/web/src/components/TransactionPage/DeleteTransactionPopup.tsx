// import { useUser } from "../../hooks/useAuth";
// import { usePopupStore } from "../../store/popup";
// import { CustomMessage } from "../Helpers";

// export function DeleteTransactionPopup({ id }: { id: string }) {
//     const { open, close } = usePopupStore();
//     const { deleteDataByIdAsync } = useUser();
//     const handleDelete = async () => {
//         try {
//             await deleteDataByIdAsync(id);
//             close();
//             setTimeout(() => open("Notification", <CustomMessage message="Transaction deleted successfully!" />), 300);
//         } catch (err) {
//             console.error(err);
//             close();
//             setTimeout(() => open("Notification", <CustomMessage message={`Something went wrong: ${err}`} />), 300);
//         }

//     }
//     return (
//         <div>
//             <div className="flex flex-col p-3 justify-center items-center transitioned text-[var(--color-text)] text-2xl">
//                 <h1>Are you sure you want to delete this transaction?</h1>
//                 <div className="flex gap-3 justify-center items-center mt-[30px]">
//                     <button onClick={handleDelete} className="px-3 py-2 cursor-pointer bg-[var(--bg-red)] rounded transitioned hover:bg-transparent border-2 border-[var(--bg-red)]">Delete</button>
//                     <button onClick={close} className="px-3 py-2 cursor-pointer bg-[var(--bg-green)] rounded transitioned hover:bg-transparent border-2 border-[var(--bg-green)] ">Cancel</button>
//                 </div>
//             </div>
//         </div>
//     )
// }

export function DeleteTransactionPopup({ id }: { id: string }) {
	console.log(id);
	return null;
}
