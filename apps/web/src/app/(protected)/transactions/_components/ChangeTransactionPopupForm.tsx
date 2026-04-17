import { useState } from "react";
import { usePopupStore } from "@/store/popup";
import { useTransactionMutations } from "@/hooks/useTransactions";
import type { ResponseTransaction } from "@fintrack/types";
import type { FormTransaction } from "@/types/transaction";
import { useNumericValidator } from "@/hooks/useNumericValidator";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useCurrency } from "@/hooks/useCurrency";
import { TransactionBasicFields } from "./TransactionBasicFields";
import { TransactionLocationSection } from "./TransactionLocationSection";
import { TransactionTypeSection } from "./TransactionTypeSection";
import { TransactionFormFooter } from "./TransactionFormFooter";
import { submitTransaction } from "./transactionSubmit";

function toManualCurrencyCode(currencyCode: string): "USD" | "UAH" | "EUR" {
  if (currencyCode === "UAH") return "UAH";
  if (currencyCode === "EUR") return "EUR";
  return "USD";
}

export function ChangeTransactionPopupForm({
  id,
  initialData,
}: {
  id?: string;
  initialData?: ResponseTransaction;
}) {
  const { displayCurrency, convertAmount } = useCurrency();
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
  const initialConvertedAmount = initialData
    ? convertAmount(
        Number(initialData.amount),
        initialData.currencyCode ?? "USD",
        displayCurrency,
      ).toString()
    : "";
  const manualCurrencyCode = toManualCurrencyCode(displayCurrency);
  const [form, setForm] = useState<FormTransaction>({
    created_at: initialData?.created_at,
    amount: initialConvertedAmount || "",
    title: initialData?.title || "",
    currencyCode: manualCurrencyCode,
    latitude: initialData?.location?.latitude?.toString() || "",
    longitude: initialData?.location?.longitude?.toString() || "",
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
      if (error instanceof Error) {
        setLocationError(error.message);
      } else {
        setLocationError("Failed to get location.");
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
    e.preventDefault();
    await submitTransaction({
      id,
      form,
      manualCurrencyCode,
      createTxErrorMessage,
      updateTxErrorMessage,
      updateTx,
      createTx,
      open,
      close,
    });
  };

  const isLocationIncomplete = !!form.latitude !== !!form.longitude;
  const isInvalid =
    !!formError || isLocationIncomplete || !form.amount || !form.title;

  return (
    <div className="bg-(--color-card) rounded-[10px] p-[20px] mx-auto">
      <form
        className="flex flex-col gap-[20px]"
        onSubmit={handleChangeTransaction}
      >
        <TransactionBasicFields
          form={form}
          displayCurrency={displayCurrency}
          onTitleChange={(value) => setForm({ ...form, title: value })}
          onDateChange={(value) =>
            setForm({
              ...form,
              created_at: new Date(value),
            })
          }
          onAmountChange={(value) => handleNumericChange("amount", value, 1)}
        />

        <TransactionLocationSection
          form={form}
          loadingLocation={loadingLocation}
          onLatitudeChange={(value) =>
            handleNumericChange("latitude", value, -90, 90)
          }
          onLongitudeChange={(value) =>
            handleNumericChange("longitude", value, -180, 180)
          }
          onGetCurrentLocation={() => {
            void handleGetCurrentLocation();
          }}
          onMapChange={(newLoc) =>
            setForm({
              ...form,
              longitude: newLoc.longitude.toString(),
              latitude: newLoc.latitude.toString(),
            })
          }
        />

        <TransactionTypeSection
          form={form}
          onTypeChange={(type) => setForm({ ...form, type })}
        />

        <TransactionFormFooter
          formError={formError}
          isLocationIncomplete={isLocationIncomplete}
          locationError={locationError}
          isCreating={isCreating}
          isUpdating={isUpdating}
          isInvalid={isInvalid}
          hasId={!!id}
        />
      </form>
    </div>
  );
}
