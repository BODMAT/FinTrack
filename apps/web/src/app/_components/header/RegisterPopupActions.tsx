import type { UserResponse } from "@fintrack/types";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface RegisterPopupActionsProps {
  user?: UserResponse;
  isLoggingOutAll: boolean;
  onLogout: () => void;
  onLogoutAll: () => void;
  onOpenLoginPopup: () => void;
}

export function RegisterPopupActions({
  user,
  isLoggingOutAll,
  onLogout,
  onLogoutAll,
  onOpenLoginPopup,
}: RegisterPopupActionsProps) {
  const { t } = useSafeTranslation();

  return (
    <div className="w-full flex gap-[20px] justify-space-between">
      {user && (
        <>
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
        </>
      )}
      <button onClick={onOpenLoginPopup} className="custom-btn">
        {t("auth.loginTitle")}
      </button>
    </div>
  );
}
