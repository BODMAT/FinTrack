interface TransactionFormFooterProps {
  formError?: string | null;
  isLocationIncomplete: boolean;
  locationError: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isInvalid: boolean;
  hasId: boolean;
}

export function TransactionFormFooter({
  formError,
  isLocationIncomplete,
  locationError,
  isCreating,
  isUpdating,
  isInvalid,
  hasId,
}: TransactionFormFooterProps) {
  return (
    <>
      <div className="min-h-[24px]">
        {formError && (
          <p className="text-red-500 text-sm animate-pulse">{formError}</p>
        )}
        {isLocationIncomplete && (
          <p className="text-red-500 text-sm animate-pulse">
            Fill both location fields or leave them empty
          </p>
        )}
        {locationError && (
          <p className="text-red-500 text-sm animate-pulse">{locationError}</p>
        )}
      </div>

      <button
        disabled={isCreating || isUpdating || isInvalid}
        type="submit"
        className="bg-(--color-hover) text-(--color-fixed) rounded-[10px] p-[10px] w-full not-disabled:hover:bg-(--color-hover-reverse) not-disabled:hover:text-(--color-hover) transitioned cursor-pointer disabled:cursor-not-allowed"
      >
        {isCreating || isUpdating
          ? "Processing..."
          : hasId
            ? "Save Changes"
            : "Create Transaction"}
      </button>
    </>
  );
}
