import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type {
  CreateUserBody as User,
  CreateAuthMethodBody,
  TelegramWidgetPayload,
} from "@fintrack/types";
import { usePopupStore } from "@/store/popup";
import { LoginPopup } from "./LoginPopup";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { RegisterPopupForm } from "./RegisterPopupForm";
import { createInitialUserLocalInfo } from "@/utils/register";
import { signIn } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { APP_BASE_PATH } from "@/config/constants";
import { clearProcessedGoogleIdToken } from "@/lib/oauthBridge";
import { TelegramLoginWidget } from "../auth/TelegramLoginWidget";
import { GoogleIcon } from "../auth/AuthProviderIcons";
import { exchangeTelegramWidgetSession } from "@/api/auth";
import { queryClient } from "@/api/queryClient";
import { useAuthStore } from "@/store/useAuthStore";

function normalizeLocalPath(path: string | null) {
  if (!path) return null;
  if (!path.startsWith("/")) return null;
  if (path.startsWith(APP_BASE_PATH)) {
    const normalized = path.slice(APP_BASE_PATH.length);
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }
  return path;
}

export function RegisterPopup() {
  const { t } = useSafeTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping);
  const { open, close } = usePopupStore();
  const {
    status: { registerError, isRegistering },
    actions: { register },
  } = useAuth();

  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState("");
  const [passwordValidationError, setPasswordValidationError] = useState("");
  const [userLocalInfo, setUserLocalInfo] = useState<User>(
    createInitialUserLocalInfo(),
  );

  const handleOpenLoginPopup = () => {
    close();
    setTimeout(() => {
      open(t("auth.loginTitle"), <LoginPopup />);
    }, 300);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterSuccess(false);
    setVerificationPendingEmail("");
    setPasswordValidationError("");

    const payload: User = {
      name: userLocalInfo.name.trim(),
      photo_url: userLocalInfo.photo_url?.trim() || null,
      authMethods: [],
    };

    const emailMethod = userLocalInfo.authMethods.find(
      (m: CreateAuthMethodBody) => m.type === "EMAIL",
    );
    if (
      emailMethod?.type === "EMAIL" &&
      emailMethod.email &&
      emailMethod.password
    ) {
      payload.authMethods.push({
        type: "EMAIL",
        email: emailMethod.email.trim(),
        password: emailMethod.password,
      });
    }

    const tgMethod = userLocalInfo.authMethods.find(
      (m: CreateAuthMethodBody) => m.type === "TELEGRAM",
    );
    if (tgMethod?.type === "TELEGRAM" && tgMethod.telegram_id) {
      payload.authMethods.push({
        type: "TELEGRAM",
        telegram_id: tgMethod.telegram_id.trim(),
      });
    }

    if (payload.authMethods.length === 0) {
      return;
    }

    if (
      emailMethod?.type === "EMAIL" &&
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(emailMethod.password)
    ) {
      setPasswordValidationError(t("auth.passwordComplexity"));
      return;
    }

    try {
      await register(payload);
      setRegisterSuccess(true);

      if (emailMethod) {
        setVerificationPendingEmail(emailMethod.email.trim());
      }

      setUserLocalInfo(createInitialUserLocalInfo());
    } catch {
      setRegisterSuccess(false);
    } finally {
      setTimeout(() => {
        setRegisterSuccess(false);
      }, 5000);
    }
  };

  const handleTelegramLogin = useCallback(
    async (payload: TelegramWidgetPayload) => {
      await exchangeTelegramWidgetSession(payload);
      setAuthenticated(true);
      setBootstrapping(false);
      await queryClient.invalidateQueries();
      const normalizedCurrentPath = normalizeLocalPath(pathname) ?? pathname;
      const nextPath = normalizeLocalPath(searchParams.get("next"));
      if (normalizedCurrentPath === "/login" && nextPath) {
        router.push(`${APP_BASE_PATH}${nextPath}`);
      } else if (normalizedCurrentPath === "/login") {
        router.push(`${APP_BASE_PATH}/dashboard`);
      }
      router.refresh();
      close();
    },
    [close, pathname, router, searchParams, setAuthenticated, setBootstrapping],
  );

  return (
    <section className="flex items-center flex-col gap-5 w-full">
      <form
        onSubmit={(e) => {
          handleRegister(e);
        }}
        className="flex flex-col gap-5 w-full"
      >
        <RegisterPopupForm
          userLocalInfo={userLocalInfo}
          setUserLocalInfo={setUserLocalInfo}
          isRegistering={isRegistering}
        />
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 w-full">
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
            Google
          </button>
          <TelegramLoginWidget mode="login" onAuth={handleTelegramLogin} />
        </div>

        <>
          {passwordValidationError && (
            <span className="text-red-500">{passwordValidationError}</span>
          )}
          {registerSuccess && (
            <span className="text-green-500">{t("auth.registerSuccess")}</span>
          )}
          {verificationPendingEmail && (
            <div className="text-amber-500 text-sm">
              {t("auth.accountCreatedVerify", {
                email: verificationPendingEmail,
              })}
            </div>
          )}
          {registerError && (
            <span className="text-red-500">{registerError}</span>
          )}
          {isRegistering && <span>{t("common.loading")}</span>}
        </>
        <span className="h-0.5 w-full bg-(--color-background) rounded" />
      </form>
      <button onClick={handleOpenLoginPopup} className="custom-btn w-full">
        {t("auth.loginTitle")}
      </button>
    </section>
  );
}
