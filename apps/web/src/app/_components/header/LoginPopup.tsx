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
    status: { loginError, isLoggingIn, isLoggingOutAll, logoutAllError },
    actions: { login, logout, logoutAll },
  } = useAuth();
  const [loginSuccess, setLoginSuccess] = useState(false);
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
    } catch (error) {
      setLoginSuccess(false);
      console.error("Login failed", error);
    } finally {
      setTimeout(() => {
        setLoginSuccess(false);
      }, 5000);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenRegisterPopup = () => {
    close();
    setTimeout(() => {
      open(t("auth.registerProfileTitle"), <RegisterPopup />);
    }, 300);
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
        <input
          required
          minLength={8}
          type="password"
          placeholder={t("auth.password")}
          value={loginFields.password}
          onChange={(e) => {
            setLoginFields((prev) => ({
              ...prev,
              password: e.target.value,
            }));
          }}
          className="custom-input"
        />
        <button type="submit" disabled={isLoggingIn} className="custom-btn">
          {t("auth.loginButton")}
        </button>
        <button
          type="button"
          onClick={() =>
            signIn("google", {
              callbackUrl: `${APP_BASE_PATH}/dashboard`,
            })
          }
          className="custom-btn"
        >
          Continue with Google
        </button>

        <div className="">
          {loginSuccess && (
            <span className="text-green-500">{t("auth.loginSuccess")}</span>
          )}
          {loginError && <span className="text-red-500">{loginError}</span>}
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
