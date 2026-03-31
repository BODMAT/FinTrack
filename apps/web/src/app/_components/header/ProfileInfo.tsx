import { usePopupStore } from "@/store/popup";
import ArrToBottom from "@/assets/arr-to-bottom.svg?react";
import AnonimusIcon from "@/assets/anonymous-user-icon.svg?react";
import { RegisterPopup } from "./RegisterPopup";
import { useAuth } from "@/hooks/useAuth";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
export function ProfileInfo() {
  const { t } = useSafeTranslation();
  const { user, isLoading, isError } = useAuth();
  const { open } = usePopupStore();
  const handleOpenPopup = () => {
    open(t("auth.registerProfileTitle"), <RegisterPopup />);
  };
  return (
    <button
      onClick={handleOpenPopup}
      className="flex items-center gap-2.5 text-(--color-fixed-text) transitioned text-[17px] font-bold group max-md:mx-auto cursor-pointer bg-transparent hover:bg-(--color-card) rounded hover:shadow p-2 w-full justify-between max-md:max-w-75"
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
      <div className="flex flex-col">
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
                .filter((auth) => auth.type === "EMAIL")
                .map((auth) => auth.email)
                .join(", ")}
            </div>
            <div className="text-[8px] mt-1 overflow-hidden">
              {user.authMethods
                .filter((auth) => auth.type === "TELEGRAM")
                .map((auth) => auth.telegram_id)
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
      <ArrToBottom className="w-5 h-5 fill-current text-(--color-fixed-text) transition-all duration-500 -rotate-90 group-hover:rotate-0" />
    </button>
  );
}
