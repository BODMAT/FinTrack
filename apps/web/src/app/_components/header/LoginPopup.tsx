import { useState } from "react";
import type { LoginUserBody } from "@fintrack/types";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { RegisterPopup } from "./RegisterPopup";
import { usePopupStore } from "@/store/popup";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { queryClient } from "@/api/queryClient";
import { useRouter } from "next/navigation";

export function LoginPopup() {
  const { t } = useSafeTranslation();
  const router = useRouter();
  const { open, close } = usePopupStore();
  const {
    user,
    status: { loginError, isLoggingIn },
    actions: { login, logout },
  } = useAuth();
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { logout: localLogout } = useAuthStore();
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
      localLogout();
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
          <button onClick={handleLogout} className="custom-btn">
            {t("auth.logout")}
          </button>
        )}
        <button onClick={handleOpenRegisterPopup} className="custom-btn">
          {t("auth.registerNew")}
        </button>
      </div>
    </section>
  );
}
