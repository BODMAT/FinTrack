import { usePopupStore } from "@/store/popup";
import AnonimusIcon from "@/assets/anonymous-user-icon.svg?react";
import { LoginPopup } from "./LoginPopup";
import { AccountPopup } from "./AccountPopup";
import { useAuth } from "@/hooks/useAuth";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import type { UserResponse } from "@fintrack/types";

type AuthMethod = UserResponse["authMethods"][number];

export function ProfileInfo() {
  const { t } = useSafeTranslation();
  const { user, isLoading, isError } = useAuth();
  const { open } = usePopupStore();

  const handleOpenAccountPopup = () => {
    open(t("auth.manageAccount"), <AccountPopup />);
  };

  const handleOpenAuthPopup = () => {
    open(t("auth.loginTitle"), <LoginPopup />);
  };

  return (
    <div className="flex flex-col gap-3 w-full max-md:max-w-75 max-md:mx-auto">
      <button
        onClick={user ? handleOpenAccountPopup : handleOpenAuthPopup}
        className="flex items-center justify-center gap-3 text-(--color-fixed-text) transitioned text-[17px] font-bold group cursor-pointer bg-transparent hover:bg-(--color-card) rounded hover:shadow p-2 w-full"
      >
        <div className="w-11.25 h-11.25 rounded-full bg-(--color-hover-reverse)">
          {user && user.photo_url ? (
            <div className="flex w-11.25 h-11.25 justify-center items-center">
              <img
                className="w-11.25 h-11.25 object-cover rounded-full"
                src={user.photo_url}
                alt={t("auth.userPhotoAlt")}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-full">
              <AnonimusIcon className="w-11.25 h-11.25opacity-80 rounded-full fill-current transitioned group-hover:opacity-100" />
            </div>
          )}
        </div>
        <div className="flex flex-col text-left">
          {isLoading && (
            <span className="text-[16px]">{t("common.loading")}</span>
          )}
          {!isLoading && user && (
            <span className="overflow-hidden">
              <div className="overflow-hidden">
                {user.name ?? t("auth.anonymous")}
              </div>
              <div className="text-[8px] mt-1 overflow-hidden">
                {user.authMethods
                  .filter((auth: AuthMethod) => auth.type === "EMAIL")
                  .map((auth: AuthMethod) => auth.email)
                  .join(", ")}
              </div>
              <div className="text-[8px] mt-1 overflow-hidden">
                {user.authMethods
                  .filter((auth: AuthMethod) => auth.type === "TELEGRAM")
                  .map((auth: AuthMethod) => auth.telegram_id)
                  .join(", ")}
              </div>
            </span>
          )}
          {!isLoading && !user && (
            <span className="text-[16px]">{t("auth.addProfile")}</span>
          )}
          {isError && (
            <span className="text-[8px] text-(--color-red)">
              {t("common.retry")}
            </span>
          )}
        </div>
      </button>

      {user && (
        <button onClick={handleOpenAuthPopup} className="custom-btn w-full">
          {t("auth.loginOrRegister")}
        </button>
      )}
    </div>
  );
}
