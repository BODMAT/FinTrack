import { useState } from "react";
import type { LoginUserBody } from "@fintrack/types";
import { useAuth } from "@/hooks/useAuth";
import { RegisterPopup } from "./RegisterPopup";
import { usePopupStore } from "@/store/popup";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { queryClient } from "@/api/queryClient";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { APP_BASE_PATH } from "@/config/constants";
import { clearProcessedGoogleIdToken } from "@/lib/oauthBridge";

function normalizeLocalPath(path: string | null) {
  if (!path) return null;
  if (!path.startsWith("/")) return null;
  if (path.startsWith(APP_BASE_PATH)) {
    const normalized = path.slice(APP_BASE_PATH.length);
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }
  return path;
}

export function LoginPopup() {
  const { t } = useSafeTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { open, close } = usePopupStore();
  const {
    user,
    status: {
      loginError,
      loginErrorCode,
      isLoggingIn,
      isLoggingOutAll,
      isResendingVerification,
      resendVerificationError,
      logoutAllError,
    },
    actions: { login, logout, logoutAll, resendVerification },
  } = useAuth();
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [loginFields, setLoginFields] = useState<LoginUserBody>({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginSuccess(false);
    try {
      await login(loginFields);
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
      setLoginSuccess(true);
      setLoginFields({
        email: "",
        password: "",
      });
    } catch {
      setLoginSuccess(false);
    } finally {
      setTimeout(() => {
        setLoginSuccess(false);
      }, 5000);
    }
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

  const handleOpenRegisterPopup = () => {
    close();
    setTimeout(() => {
      open(t("auth.registerProfileTitle"), <RegisterPopup />);
    }, 300);
  };

  const handleResendVerification = async () => {
    if (!loginFields.email.trim()) return;
    try {
      await resendVerification(loginFields.email.trim());
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch {
      setResendSuccess(false);
    }
  };

  return (
    <section className="flex items-center flex-col gap-5 w-full">
      <form
        onSubmit={(e) => {
          handleLogin(e);
        }}
        className="flex flex-col gap-5 w-full"
      >
        <input
          required
          type="email"
          placeholder={t("auth.email")}
          value={loginFields.email}
          onChange={(e) => {
            setLoginFields((prev) => ({
              ...prev,
              email: e.target.value,
            }));
          }}
          className="custom-input"
        />
        <div className="relative w-full">
          <input
            required
            minLength={8}
            type={isPasswordVisible ? "text" : "password"}
            placeholder={t("auth.password")}
            value={loginFields.password}
            onChange={(e) => {
              setLoginFields((prev) => ({
                ...prev,
                password: e.target.value,
              }));
            }}
            className="custom-input pr-11"
          />
          <button
            type="button"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            onClick={() => {
              setIsPasswordVisible((prev) => !prev);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text) opacity-75 hover:opacity-100 transitioned"
          >
            {isPasswordVisible ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l18 18" />
                <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                <path d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-1 2.27-2.74 4.17-4.9 5.32" />
                <path d="M6.61 6.61C4.62 8 3.1 9.86 2 12c1.73 3.89 6 7 10 7 1.65 0 3.23-.43 4.61-1.18" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <button type="submit" disabled={isLoggingIn} className="custom-btn">
          {t("auth.loginButton")}
        </button>
        <button
          type="button"
          onClick={() => {
            clearProcessedGoogleIdToken();
            void signIn("google", {
              callbackUrl: `${APP_BASE_PATH}/dashboard`,
            });
          }}
          className="custom-btn"
        >
          Continue with Google
        </button>

        <div className="">
          {loginSuccess && (
            <span className="text-green-500">{t("auth.loginSuccess")}</span>
          )}
          {loginError && <span className="text-red-500">{loginError}</span>}
          {loginErrorCode === 403 && (
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  void handleResendVerification();
                }}
                disabled={isResendingVerification}
                className="custom-btn"
              >
                {isResendingVerification
                  ? "Sending verification email..."
                  : "Resend verification email"}
              </button>
              {resendSuccess && (
                <span className="text-green-500">
                  Verification email sent. Check your inbox.
                </span>
              )}
              {resendVerificationError && (
                <span className="text-red-500">{resendVerificationError}</span>
              )}
            </div>
          )}
          {isLoggingIn && <span>{t("common.loading")}</span>}
        </div>
        <span className="h-0.5 w-full bg-(--color-background) rounded" />
      </form>
      <div className="w-full flex gap-5 justify-space-between">
        {user && (
          <>
            <button onClick={handleLogout} className="custom-btn">
              {t("auth.logout")}
            </button>
            <button
              onClick={handleLogoutAll}
              disabled={isLoggingOutAll}
              className="custom-btn"
            >
              {t("auth.logoutAllSessions")}
            </button>
          </>
        )}
        <button onClick={handleOpenRegisterPopup} className="custom-btn">
          {t("auth.registerNew")}
        </button>
      </div>
      {logoutAllError && <span className="text-red-500">{logoutAllError}</span>}
    </section>
  );
}
