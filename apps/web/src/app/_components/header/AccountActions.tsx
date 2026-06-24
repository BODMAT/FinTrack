import { useState } from "react";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface AccountActionsProps {
  isLoggingOutAll: boolean;
  isDeletingAccount: boolean;
  onLogout: () => void;
  onLogoutAll: () => void;
  onDeleteAccount: () => void;
}

export function AccountActions({
  isLoggingOutAll,
  isDeletingAccount,
  onLogout,
  onLogoutAll,
  onDeleteAccount,
}: AccountActionsProps) {
  const { t } = useSafeTranslation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="w-full flex gap-5 justify-space-between">
        <button onClick={onLogout} className="custom-btn">
          {t("auth.logout")}
        </button>
        <button
          onClick={onLogoutAll}
          disabled={isLoggingOutAll}
          className="custom-btn"
        >
          {t("auth.logoutAllSessions")}
        </button>
      </div>

      {!confirmingDelete ? (
        <button
          type="button"
          onClick={() => {
            setConfirmingDelete(true);
          }}
          className="w-full rounded-[10px] border border-(--text-red) bg-(--bg-red) px-[14px] py-[9px] text-[14px] font-semibold text-(--text-red) transitioned not-disabled:cursor-pointer not-disabled:hover:opacity-85"
        >
          {t("auth.deleteAccount")}
        </button>
      ) : (
        <div className="flex flex-col gap-3 w-full rounded border border-(--text-red) p-3">
          <span className="text-sm text-(--text-red)">
            {t("auth.deleteAccountConfirm")}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDeleteAccount}
              disabled={isDeletingAccount}
              className="flex-1 rounded-[10px] border border-(--text-red) bg-(--bg-red) px-[14px] py-[9px] text-[14px] font-semibold text-(--text-red) transitioned not-disabled:cursor-pointer not-disabled:hover:opacity-85"
            >
              {isDeletingAccount
                ? t("auth.deleteAccountDeleting")
                : t("auth.deleteAccountConfirmYes")}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmingDelete(false);
              }}
              disabled={isDeletingAccount}
              className="custom-btn flex-1"
            >
              {t("auth.deleteAccountCancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
