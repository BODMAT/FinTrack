import { useUserDataById } from "../../hooks/useUserData";

export function ChangeTransactionPopup({ id }: { id?: number | undefined }) {
    const currentData = id ? useUserDataById(0, id) : undefined;

    return (
        <div className="bg-[var(--color-card)] rounded-[10px] p-[20px] mx-auto">
            <h2 className="text-[var(--color-title)] text-[24px] font-bold mb-[10px]">
                {id ? "Change transaction" : "Transaction add transaction"}
            </h2>
            <form>
                <div className="flex flex-col mb-[20px]">
                    <label className="text-[var(--color-text)] text-[16px] font-semibold mb-[10px]" htmlFor="date">
                        Date:
                    </label>
                    <input
                        type="date"
                        id="date"
                        value={currentData ? currentData.date : ""}
                        onChange={(e) => console.log(e.target.value)}
                        className="bg-[var(--color-input)] rounded-[10px] p-[10px] w-full border-1 border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned hover:border-[var(--color-hover)]"
                    />
                </div>
                <div className="flex flex-col mb-[20px]">
                    <label className="text-[var(--color-text)] text-[16px] font-semibold mb-[10px]" htmlFor="amount">
                        Amount:
                    </label>
                    <input
                        type="number"
                        id="amount"
                        value={currentData ? currentData.amount : ""}
                        onChange={(e) => console.log(e.target.value)}
                        className="bg-[var(--color-input)] rounded-[10px] p-[10px] w-full border-1 border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned hover:border-[var(--color-hover)]"
                    />
                </div>
                <div className="flex flex-col mb-[20px]">
                    <label className="text-[var(--color-text)] text-[16px] font-semibold mb-[10px]" htmlFor="location">
                        Location:
                    </label>
                    <input
                        type="text"
                        id="location"
                        value={currentData ? currentData.location : ""}
                        onChange={(e) => console.log(e.target.value)}
                        className="bg-[var(--color-input)] rounded-[10px] p-[10px] w-full border-1 border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned hover:border-[var(--color-hover)]"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-[var(--color-hover)] text-[var(--color-fixed)] rounded-[10px] p-[10px] w-full hover:bg-[var(--color-hover-reverse)] hover:text-[var(--color-hover)] transitioned cursor-pointer"
                >
                    Change
                </button>
            </form>
        </div>
    );
}