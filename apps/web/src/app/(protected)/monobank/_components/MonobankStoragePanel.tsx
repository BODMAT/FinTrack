import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface MonobankStoragePanelProps {
  isDeletingMonobankData: boolean;
  onDelete: () => void;
}

export function MonobankStoragePanel({
  isDeletingMonobankData,
  onDelete,
}: MonobankStoragePanelProps) {
  const { t } = useSafeTranslation();

  return (
    <div className="neo-panel p-[16px]">
      <div className="flex items-center justify-between gap-[10px] max-[600px]:flex-col max-[600px]:items-start">
        <div>
          <h3 className="text-(--color-text) text-[18px] font-semibold">
            {t("monobank.storageTitle")}
          </h3>
          <p className="text-(--color-fixed-text) text-[13px]">
            {t("monobank.storageDesc")}
          </p>
        </div>
        <button
          onClick={onDelete}
          disabled={isDeletingMonobankData}
          className="rounded-[10px] border border-(--text-red) bg-(--bg-red) px-[14px] py-[9px] text-[14px] font-semibold text-(--text-red) transitioned not-disabled:cursor-pointer not-disabled:hover:opacity-85"
        >
          {isDeletingMonobankData
            ? t("monobank.deleting")
            : t("monobank.deleteMyData")}
        </button>
      </div>
    </div>
  );
}
