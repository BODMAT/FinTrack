import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type {
  CreateUserBody as User,
  CreateAuthMethodBody,
} from "@fintrack/types";
import { usePopupStore } from "@/store/popup";
import { LoginPopup } from "./LoginPopup";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { RegisterPopupForm } from "./RegisterPopupForm";
import { RegisterPopupActions } from "./RegisterPopupActions";
import { createInitialUserLocalInfo } from "@/utils/register";
import { signIn } from "next-auth/react";
import { APP_BASE_PATH } from "@/config/constants";
import { clearProcessedGoogleIdToken } from "@/lib/oauthBridge";

export function RegisterPopup() {
  const { t } = useSafeTranslation();
  const { open, close } = usePopupStore();
  const {
    user,
    status: { registerError, isRegistering, isLoggingOutAll, logoutAllError },
    actions: { register, logout, logoutAll },
  } = useAuth();

  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState("");
  const [passwordValidationError, setPasswordValidationError] = useState("");
  const [userLocalInfo, setUserLocalInfo] = useState<User>(
    createInitialUserLocalInfo(),
  );

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
      setPasswordValidationError(
        "Password must contain uppercase, lowercase letters and a number",
      );
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

  return (
    <section className="flex items-center flex-col gap-[20px] w-full">
      <form
        onSubmit={(e) => {
          handleRegister(e);
        }}
        className="flex flex-col gap-[20px] w-full"
      >
        <RegisterPopupForm
          userLocalInfo={userLocalInfo}
          setUserLocalInfo={setUserLocalInfo}
          isRegistering={isRegistering}
        />
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
          {passwordValidationError && (
            <span className="text-red-500">{passwordValidationError}</span>
          )}
          {registerSuccess && (
            <span className="text-green-500">{t("auth.registerSuccess")}</span>
          )}
          {verificationPendingEmail && (
            <div className="text-amber-500 text-sm">
              Account created. We sent a verification link to{" "}
              <strong>{verificationPendingEmail}</strong>. Please verify your
              email, then log in.
            </div>
          )}
          {registerError && (
            <span className="text-red-500">{registerError}</span>
          )}
          {isRegistering && <span>{t("common.loading")}</span>}
        </div>
        <span className="h-[2px] w-full bg-(--color-background) rounded" />
      </form>
      <RegisterPopupActions
        user={user}
        isLoggingOutAll={isLoggingOutAll}
        onLogout={() => {
          void handleLogout();
        }}
        onLogoutAll={() => {
          void handleLogoutAll();
        }}
        onOpenLoginPopup={handleOpenLoginPopup}
      />
      {logoutAllError && <span className="text-red-500">{logoutAllError}</span>}
    </section>
  );
}
