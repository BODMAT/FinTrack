import { useState } from "react";
import dynamic from "next/dynamic";
import { toLocalDatetimeString } from "@/utils/components";
import { usePopupStore } from "@/store/popup";
import { CustomMessage } from "@/shared/ui/Helpers";
import {
  useTransaction,
  useTransactionMutations,
} from "@/hooks/useTransactions";
import type {
  CreateTransaction,
  Location,
  UpdateTransaction,
  ResponseTransaction,
} from "@fintrack/types";
import type { FormTransaction } from "@/types/transaction";
import { useNumericValidator } from "@/hooks/useNumericValidator";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

interface MapPickerProps {
  value: Location | undefined;
  onChange: (loc: Location) => void;
}

const MapPicker = dynamic<MapPickerProps>(
  () => import("./MapPicker").then((module) => module.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] w-full rounded-[10px] border border-(--color-fixed-text)" />
    ),
  },
);

export function ChangeTransactionPopup({ id }: { id?: string }) {
  const { data: transaction, isLoading } = useTransaction({
    id,
    enabled: !!id,
  });

  if (id && isLoading) return <div>Loading...</div>;

  return <TransactionFormContent id={id} initialData={transaction} />;
}

function TransactionFormContent({
  id,
  initialData,
}: {
  id?: string;
  initialData?: ResponseTransaction;
}) {
  const {
    updateTx,
    isUpdating,
    createTx,
    isCreating,
    createTxErrorMessage,
    updateTxErrorMessage,
  } = useTransactionMutations();

  const { open, close } = usePopupStore();
  const { fetchLocation, loadingLocation, locationError, setLocationError } =
    useCurrentLocation();
  const [form, setForm] = useState<FormTransaction>({
    created_at: initialData?.created_at,
    amount: initialData?.amount?.toString() || "",
    title: initialData?.title || "",
    latitude: initialData?.location?.latitude.toString(),
    longitude: initialData?.location?.longitude.toString(),
    type: initialData?.type || "INCOME",
  });

  const { formError, validateNumericInput } = useNumericValidator();

  const handleGetCurrentLocation = async () => {
    try {
      const result = await fetchLocation();
      setForm((prev) => ({
        ...prev,
        latitude: result.latitude.toString(),
        longitude: result.longitude.toString(),
      }));
      setLocationError(null);
    } catch (error) {
      console.error("Error fetching location:", error);
      if (error instanceof Error) {
        setLocationError(error.message);
      }
    }
  };
  const handleNumericChange = (
    field: "amount" | "latitude" | "longitude",
    value: string,
    min?: number,
    max?: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: validateNumericInput(prev[field] || "", value, min, max),
    }));
  };

  const handleChangeTransaction = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    try {
      e.preventDefault();
      const data: CreateTransaction = {
        title: form.title,
        type: form.type,
        created_at: form.created_at,
        updated_at: new Date(),
        amount: +form.amount,
      };
      if (form.latitude && form.longitude) {
        data.location = {
          latitude: +form.latitude,
          longitude: +form.longitude,
        };
      }
      if (id) {
        await updateTx({
          id,
          payload: data satisfies UpdateTransaction,
        });
        close();
        setTimeout(
          () =>
            open(
              "Notification",
              <CustomMessage message="Transaction changed successfully!" />,
            ),
          300,
        );
      } else {
        await createTx(data satisfies CreateTransaction);
        close();
        setTimeout(
          () =>
            open(
              "Notification",
              <CustomMessage message="Transaction added successfully!" />,
            ),
          300,
        );
      }
    } catch (error) {
      open(
        "Error",
        <CustomMessage
          message={`Something went wrong! ${createTxErrorMessage || updateTxErrorMessage || error || ""}`}
        />,
      );
    }
  };

  const isLocationIncomplete = !!form.latitude !== !!form.longitude;
  const isInvalid =
    !!formError || isLocationIncomplete || !form.amount || !form.title;

  return (
    <div className="bg-(--color-card) rounded-[10px] p-[20px] mx-auto">
      <form className="flex flex-col gap-[20px]" onSubmit={handleChangeTransaction}>
        <div className="flex items-center gap-[20px] max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
          <label
            className="text-(--color-text) text-[20px] font-semibold min-w-[120px]"
            htmlFor="location"
          >
            Title:
          </label>
          <input
            required
            type="text"
            id="title"
            placeholder="Title..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-(--color-input) rounded-[10px] p-[10px] w-full border border-(--color-fixed-text) text-(--color-text) transitioned hover:border-(--color-hover)"
          />
        </div>
        <div className="flex items-center gap-[20px] max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
          <label
            className="text-(--color-text) text-[20px] font-semibold min-w-[120px]"
            htmlFor="date"
          >
            Date:
          </label>
          <input
            required
            type="datetime-local"
            max={toLocalDatetimeString(new Date())}
            value={toLocalDatetimeString(form.created_at || new Date())}
            onChange={(e) =>
              setForm({
                ...form,
                created_at: new Date(e.target.value),
              })
            }
            id="date"
            className="bg-(--color-input) rounded-[10px] p-[10px] w-full border border-(--color-fixed-text) text-(--color-text) transitioned hover:border-(--color-hover)"
          />
        </div>
        <div className="flex items-center gap-[20px] max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
          <label
            className="text-(--color-text) text-[20px] font-semibold min-w-[120px]"
            htmlFor="amount"
          >
            Amount:
          </label>
          <input
            required
            type="text"
            inputMode="decimal"
            id="amount"
            min={1}
            placeholder="Amount..."
            value={form.amount}
            onChange={(e) => handleNumericChange("amount", e.target.value, 1)}
            className="bg-(--color-input) rounded-[10px] p-[10px] w-full border border-(--color-fixed-text) text-(--color-text) transitioned hover:border-(--color-hover)"
          />
        </div>

        {/* Location */}
        <section className="flex gap-[20px] items-center	">
          <div className="flex flex-col gap-[20px]">
            <div className="flex items-center gap-[20px] max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
              <label
                htmlFor="locationLat"
                className="text-(--color-text) text-[20px] font-semibold min-w-[120px]"
              >
                Latitude:
              </label>
              <input
                type="text"
                inputMode="decimal"
                id="locationLat"
                placeholder="23,456"
                min={-90}
                max={90}
                value={form.latitude}
                onChange={(e) =>
                  handleNumericChange("latitude", e.target.value, -90, 90)
                }
                className="bg-(--color-input) rounded-[10px] p-[10px] w-full border border-(--color-fixed-text) text-(--color-text) transitioned hover:border-(--color-hover)"
              />
            </div>

            <div className="flex items-center gap-[20px] max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
              <label
                htmlFor="locationLng"
                className="text-(--color-text) text-[20px] font-semibold min-w-[120px]"
              >
                Longitude:
              </label>
              <input
                type="text"
                inputMode="decimal"
                id="locationLng"
                placeholder="23,456"
                min={-180}
                max={180}
                value={form.longitude}
                onChange={(e) =>
                  handleNumericChange("longitude", e.target.value, -180, 180)
                }
                className="bg-(--color-input) rounded-[10px] p-[10px] w-full border border-(--color-fixed-text) text-(--color-text) transitioned hover:border-(--color-hover)"
              />
            </div>
            <button
              type="button"
              disabled={loadingLocation}
              onClick={handleGetCurrentLocation}
              className="not-disabled:cursor-pointer bg-(--color-card) rounded-[10px] p-[10px] text-(--color-text) border border-(--color-fixed-text) transitioned not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover) not-disabled:hover:scale-95 text-[16px] font-bold"
            >
              Get current location
            </button>
          </div>
          <div className="w-full h-full flex overflow-hidden">
            <MapPicker
              value={
                form.longitude && form.latitude
                  ? {
                    latitude: +form.latitude,
                    longitude: +form.longitude,
                  }
                  : undefined
              }
              onChange={(newLoc) =>
                setForm({
                  ...form,
                  longitude: newLoc.longitude.toString(),
                  latitude: newLoc.latitude.toString(),
                })
              }
            />
          </div>
        </section>

        <div className="flex gap-[28px] items-center justify-center max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
          <label className="text-(--color-text) text-[20px] font-semibold">
            <input
              className="mr-[12px]"
              type="radio"
              name="transactionType"
              checked={form.type === "INCOME"}
              onChange={() => setForm({ ...form, type: "INCOME" })}
            />
            Income
          </label>
          <label className="text-(--color-text) text-[20px] font-semibold">
            <input
              className="mr-[12px]"
              type="radio"
              name="transactionType"
              checked={form.type === "EXPENSE"}
              onChange={() => setForm({ ...form, type: "EXPENSE" })}
            />
            Outcome
          </label>
        </div>

        <div className="min-h-[24px]">
          {formError && (
            <p className="text-red-500 text-sm animate-pulse">⚠️ {formError}</p>
          )}
          {isLocationIncomplete && (
            <p className="text-red-500 text-sm animate-pulse">
              ⚠️ Fill both location fields or leave them empty
            </p>
          )}
          {locationError && (
            <p className="text-red-500 text-sm animate-pulse">
              ⚠️ {locationError}
            </p>
          )}
        </div>

        <button
          disabled={isCreating || isUpdating || isInvalid}
          type="submit"
          className="bg-(--color-hover) text-(--color-fixed) rounded-[10px] p-[10px] w-full not-disabled:hover:bg-(--color-hover-reverse) not-disabled:hover:text-(--color-hover) transitioned cursor-pointer disabled:cursor-not-allowed"
        >
          {isCreating || isUpdating
            ? "Processing..."
            : id
              ? "Save Changes"
              : "Create Transaction"}
        </button>
      </form>
    </div>
  );
}





