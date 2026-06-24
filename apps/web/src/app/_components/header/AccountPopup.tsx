import { useState } from "react";
import { signIn } from "next-auth/react";
import type { TelegramWidgetPayload, UserResponse } from "@fintrack/types";
import { useAuth } from "@/hooks/useAuth";
import { usePopupStore } from "@/store/popup";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { APP_BASE_PATH } from "@/config/constants";
import { clearProcessedGoogleIdToken } from "@/lib/oauthBridge";
import { TelegramLoginWidget } from "../auth/TelegramLoginWidget";
import { GoogleIcon } from "../auth/AuthProviderIcons";
import { linkTelegramAccount } from "@/api/auth";
import { queryClient } from "@/api/queryClient";
import { AccountActions } from "./AccountActions";
import { AccountPasswordForm } from "./AccountPasswordForm";

type AuthMethod = UserResponse["authMethods"][number];

export function AccountPopup() {
  const { t } = useSafeTranslation();
  const { close } = usePopupStore();
  const {
    user,
    status: {
      isUpdating,
      updateError,
      isLoggingOutAll,
      logoutAllError,
      isDeletingAccount,
      deleteAccountError,
    },
    actions: { update, logout, logoutAll, deleteAccount },
  } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [photoUrl, setPhotoUrl] = useState(user?.photo_url ?? "");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [telegramLinkSuccess, setTelegramLinkSuccess] = useState(false);
  const [telegramLinkError, setTelegramLinkError] = useState("");

  if (!user) return null;

  const emailSet = new Set<string>();
  if (user.email) emailSet.add(user.email);
  user.authMethods.forEach((m: AuthMethod) => {
    if (m.type === "EMAIL" && m.email) emailSet.add(m.email);
  });
  const emails = [...emailSet].join(", ");

  const telegrams = user.authMethods
    .filter((m: AuthMethod) => m.type === "TELEGRAM")
    .map((m: AuthMethod) => m.telegram_id)
    .filter(Boolean)
    .join(", ");

  const hasTelegram = user.authMethods.some(
    (m: AuthMethod) => m.type === "TELEGRAM" && m.telegram_id,
  );

  const hasGoogle = user.authMethods.some(
    (m: AuthMethod) => m.type === "GOOGLE",
  );

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdateSuccess(false);
    update(
      { name: name.trim(), photo_url: photoUrl.trim() || null },
      {
        onSuccess: () => {
          setUpdateSuccess(true);
          setTimeout(() => {
            setUpdateSuccess(false);
          }, 5000);
        },
      },
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      void 0;
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
    } catch {
      void 0;
    }
  };

  const handleDeleteAccount = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        close();
      },
    });
  };

  const handleTelegramLink = async (payload: TelegramWidgetPayload) => {
    setTelegramLinkSuccess(false);
    setTelegramLinkError("");
    try {
      await linkTelegramAccount(payload);
      await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setTelegramLinkSuccess(true);
    } catch (err) {
      setTelegramLinkError(
        err instanceof Error ? err.message : t("auth.telegramLinkFailed"),
      );
    }
  };

  return (
    <section className="flex flex-col gap-5 w-full">
      <div className="flex items-center gap-3 w-full">
        <div className="w-12 h-12 rounded-full bg-(--color-hover-reverse) overflow-hidden shrink-0">
          {user.photo_url && (
            <img
              src={user.photo_url}
              alt={t("auth.userPhotoAlt")}
              className="w-12 h-12 object-cover rounded-full"
            />
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold truncate">{user.name}</span>
          {emails && (
            <span className="text-[12px] opacity-75 truncate">{emails}</span>
          )}
          {telegrams && (
            <span className="text-[12px] opacity-75 truncate">{telegrams}</span>
          )}
        </div>
      </div>

      <span className="h-0.5 w-full bg-(--color-background) rounded" />

      <form onSubmit={handleSaveProfile} className="flex flex-col gap-5 w-full">
        <input
          required
          type="text"
          value={name}
          placeholder={t("auth.name")}
          onChange={(e) => {
            setName(e.target.value);
          }}
          className="custom-input"
        />
        <input
          type="url"
          value={photoUrl}
          placeholder={t("auth.photoUrlOptional")}
          onChange={(e) => {
            setPhotoUrl(e.target.value);
          }}
          className="custom-input"
        />
        <button type="submit" disabled={isUpdating} className="custom-btn">
          {isUpdating ? t("common.loading") : t("auth.saveProfile")}
        </button>
        {updateSuccess && (
          <span className="text-green-500">{t("auth.profileUpdated")}</span>
        )}
        {updateError && <span className="text-red-500">{updateError}</span>}
      </form>

      <span className="h-0.5 w-full bg-(--color-background) rounded" />

      <AccountPasswordForm user={user} />

      {(!hasGoogle || !hasTelegram) && (
        <>
          <span className="h-0.5 w-full bg-(--color-background) rounded" />
          <div className="flex flex-col gap-2 w-full">
            <span className="text-[13px] opacity-75">
              {t("auth.linkMethodsTitle")}
            </span>
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 w-full">
              {!hasGoogle && (
                <button
                  type="button"
                  onClick={() => {
                    clearProcessedGoogleIdToken();
                    void signIn("google", {
                      callbackUrl: `${APP_BASE_PATH}/dashboard`,
                    });
                  }}
                  className="custom-btn flex flex-1 items-center justify-center gap-2"
                >
                  <GoogleIcon />
                  {t("auth.linkGoogle")}
                </button>
              )}
              {!hasTelegram && (
                <TelegramLoginWidget mode="link" onAuth={handleTelegramLink} />
              )}
            </div>
            {telegramLinkSuccess && (
              <span className="text-green-500">{t("auth.telegramLinked")}</span>
            )}
            {telegramLinkError && (
              <span className="text-red-500">{telegramLinkError}</span>
            )}
          </div>
        </>
      )}

      <span className="h-0.5 w-full bg-(--color-background) rounded" />

      <AccountActions
        isLoggingOutAll={isLoggingOutAll}
        isDeletingAccount={isDeletingAccount}
        onLogout={() => {
          void handleLogout();
        }}
        onLogoutAll={() => {
          void handleLogoutAll();
        }}
        onDeleteAccount={handleDeleteAccount}
      />
      {logoutAllError && <span className="text-red-500">{logoutAllError}</span>}
      {deleteAccountError && (
        <span className="text-red-500">{deleteAccountError}</span>
      )}
    </section>
  );
}
