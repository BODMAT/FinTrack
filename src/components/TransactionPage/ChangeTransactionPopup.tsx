import { useState } from "react";
import { changeDataById, getUserDataById } from "../../utils/query";
import { sanitizeAmountInput, toLocalDatetimeString } from "../../utils/components";
import type { IData, IDataForm } from "../../types/custom";
import { generateId } from "../../utils/data.helpers";
import { usePopupStore } from "../../store/popup";
import { CustomMessage } from "../Helpers";

export function ChangeTransactionPopup({ id }: { id?: number | undefined }) {
    const currentData = id ? getUserDataById(id) : undefined;
    const { open, close } = usePopupStore();
    const [form, setForm] = useState<IDataForm>({
        id: id ?? generateId(),
        date: currentData ? currentData.date : new Date().toISOString(),
        title: currentData ? currentData.title : "",
        amount: currentData ? String(currentData.amount) : "0",
        location: currentData
            ? {
                lat: String(currentData.location?.lat ?? 0),
                lng: String(currentData.location?.lng ?? 0),
            }
            : { lat: "0", lng: "0" },

        isIncome: currentData ? currentData.isIncome : true
    });
    const handleChangeTransaction = (e: React.FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault();
            const numericAmount = Number(form.amount.replace(",", "."));
            const numericLocationLat = Number(form.location?.lat.replace(",", "."));
            const numericLocationLng = Number(form.location?.lng.replace(",", "."));
            if (isNaN(numericAmount) || isNaN(numericLocationLat) || isNaN(numericLocationLng)) {
                return;
            }

            const data: IData = {
                id: form.id,
                title: form.title,
                amount: numericAmount,
                date: form.date,
                isIncome: form.isIncome,
                ...(numericLocationLat !== 0 && numericLocationLng !== 0
                    ? { location: { lat: numericLocationLat, lng: numericLocationLng } }
                    : {}),
            };

            if (id) {
                changeDataById(data.id, data);
                close();
                setTimeout(() => open("Notification", <CustomMessage message="Transaction changed successfully!" />), 300);
            } else {
                changeDataById(data.id, data, true);
                close();
                setTimeout(() => open("Notification", <CustomMessage message="Transaction added successfully!" />), 300);
            }

        } catch (error) {
            open("Error", <CustomMessage message="Something went wrong!" />);
        }
    }

    const handleLocationChange = (key: "lat" | "lng", value: string) => {
        const sanitized = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

        setForm({
            ...form,
            location: {
                lat: key === "lat" ? sanitized : form.location?.lat ?? "",
                lng: key === "lng" ? sanitized : form.location?.lng ?? "",
            },
        });
    };


    return (
        <div className="bg-[var(--color-card)] rounded-[10px] p-[20px] mx-auto">
            <form className="flex flex-col gap-5" onSubmit={handleChangeTransaction}>
                <div className="flex items-center gap-5 max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-3">
                    <label className="text-[var(--color-text)] text-[20px] font-semibold min-w-30" htmlFor="location">
                        Title:
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="bg-[var(--color-input)] rounded-[10px] p-[10px] w-full border-1 border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned hover:border-[var(--color-hover)]"
                    />
                </div>
                <div className="flex items-center gap-5 max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-3">
                    <label className="text-[var(--color-text)] text-[20px] font-semibold min-w-30" htmlFor="date">
                        Date:
                    </label>
                    <input
                        type="datetime-local"
                        value={toLocalDatetimeString(new Date(form.date))}
                        onChange={(e) => setForm({ ...form, date: new Date(e.target.value).toISOString() })}
                        id="date"
                        className="bg-[var(--color-input)] rounded-[10px] p-[10px] w-full border-1 border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned hover:border-[var(--color-hover)]"
                    />
                </div>
                <div className="flex items-center gap-5 max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-3">
                    <label className="text-[var(--color-text)] text-[20px] font-semibold min-w-30" htmlFor="amount">
                        Amount:
                    </label>
                    <input
                        type="text"
                        id="amount"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: sanitizeAmountInput(e.target.value) })}
                        className="bg-[var(--color-input)] rounded-[10px] p-[10px] w-full border-1 border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned hover:border-[var(--color-hover)]"
                    />
                </div>

                {/* Location */}
                <div className="flex items-center gap-5 max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-3">
                    <label htmlFor="locationLat" className="text-[var(--color-text)] text-[20px] font-semibold min-w-30">
                        Latitude:
                    </label>
                    <input
                        type="text"
                        id="locationLat"
                        placeholder="23.456"
                        value={form.location?.lat}
                        onChange={(e) => handleLocationChange("lat", e.target.value)}
                        className="bg-[var(--color-input)] rounded-[10px] p-[10px] w-full border-1 border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned hover:border-[var(--color-hover)]"
                    />
                </div>

                <div className="flex items-center gap-5 max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-3">
                    <label htmlFor="locationLng" className="text-[var(--color-text)] text-[20px] font-semibold min-w-30">
                        Longitude:
                    </label>
                    <input
                        type="text"
                        id="locationLng"
                        placeholder="23.456"
                        value={form.location?.lng}
                        onChange={(e) => handleLocationChange("lng", e.target.value)}
                        className="bg-[var(--color-input)] rounded-[10px] p-[10px] w-full border-1 border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned hover:border-[var(--color-hover)]"
                    />
                </div>

                <div className="flex gap-7 items-center justify-center max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-3">
                    <label className="text-[var(--color-text)] text-[20px] font-semibold">
                        <input
                            className="mr-3"
                            type="radio"
                            name="transactionType"
                            checked={form.isIncome}
                            onChange={() => setForm({ ...form, isIncome: true })}
                        />
                        Income
                    </label>
                    <label className="text-[var(--color-text)] text-[20px] font-semibold">
                        <input
                            className="mr-3"
                            type="radio"
                            name="transactionType"
                            checked={!form.isIncome}
                            onChange={() => setForm({ ...form, isIncome: false })}
                        />
                        Outcome
                    </label>
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