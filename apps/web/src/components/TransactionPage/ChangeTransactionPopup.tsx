import { useEffect, useMemo, useState } from "react";
import { sanitizeAmountInput, toLocalDatetimeString } from "../../utils/components";
import type { IData, IDataForm } from "../../types/custom";
import { generateId } from "../../utils/data.helpers";
import { usePopupStore } from "../../store/popup";
import { CustomMessage } from "../Helpers";
import { useUser } from "../../hooks/useUser";

export function ChangeTransactionPopup({ id }: { id?: string | undefined }) {
    const { changeDataById, getUserDataById } = useUser();
    const { data: currentData } = getUserDataById(id ?? "", {
        enabled: !!id
    });

    const { open, close } = usePopupStore();
    const [form, setForm] = useState<IDataForm>({
        userId: "97e72bd8-96c2-4150-a98e-852de2ab46e8",
        id: generateId(),
        created_at: new Date().toISOString(),
        title: "",
        amount: "0",
        location: { latitude: "0", longitude: "0" },
        type: "INCOME",
    });

    useEffect(() => {
        if (currentData) {
            setForm({
                userId: currentData.userId,
                id: currentData.id,
                created_at: currentData.created_at,
                title: currentData.title,
                amount: String(currentData.amount),
                location: {
                    latitude: String(currentData.location?.latitude ?? 0),
                    longitude: String(currentData.location?.longitude ?? 0),
                },
                type: currentData.type,
            });
        }
    }, [currentData]);

    const handleChangeTransaction = (e: React.FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault();
            const numericAmount = Number(form.amount.replace(",", "."));
            const numericLocationLat = Number(form.location?.latitude.replace(",", "."));
            const numericLocationLng = Number(form.location?.longitude.replace(",", "."));
            if (isNaN(numericAmount) || isNaN(numericLocationLat) || isNaN(numericLocationLng)) {
                console.error("Invalid numeric values:", numericAmount, numericLocationLat, numericLocationLng);
                return;
            }

            const data: IData = {
                userId: form.userId,
                id: form.id,
                title: form.title,
                amount: numericAmount,
                created_at: form.created_at,
                type: form.type,
                ...(numericLocationLat !== 0 && numericLocationLng !== 0
                    ? { location: { latitude: numericLocationLat, longitude: numericLocationLng } }
                    : {}),
            };

            if (id) {
                changeDataById({ dataId: data.id, newData: data });
                close();
                setTimeout(() => open("Notification", <CustomMessage message="Transaction changed successfully!" />), 300);
            } else {
                changeDataById({ dataId: data.id, newData: data, isNewOrChange: true });
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
                latitude: key === "lat" ? sanitized : form.location?.latitude ?? "",
                longitude: key === "lng" ? sanitized : form.location?.longitude ?? "",
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
                        value={toLocalDatetimeString(new Date(form.created_at))}
                        onChange={(e) => setForm({ ...form, created_at: new Date(e.target.value).toISOString() })}
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
                        value={form.location?.latitude}
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
                        value={form.location?.longitude}
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
                            checked={form.type === "INCOME"}
                            onChange={() => setForm({ ...form, type: "INCOME" })}
                        />
                        Income
                    </label>
                    <label className="text-[var(--color-text)] text-[20px] font-semibold">
                        <input
                            className="mr-3"
                            type="radio"
                            name="transactionType"
                            checked={form.type === "EXPENSE"}
                            onChange={() => setForm({ ...form, type: "EXPENSE" })}
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