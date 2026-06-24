import { useState } from "react";
import type { UserResponse } from "@fintrack/types";
import { useAuth } from "@/hooks/useAuth";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

const PASSWORD_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/;

type AuthMethod = UserResponse["authMethods"][number];

interface AccountPasswordFormProps {
  user: UserResponse;
}

export function AccountPasswordForm({ user }: AccountPasswordFormProps) {
  const { t } = useSafeTranslation();
  const {
    status: { isUpdating, updateError },
    actions: { update },
  } = useAuth();

  const emailMethod = user.authMethods.find(
    (m: AuthMethod) => m.type === "EMAIL",
  );
  const hasEmailLogin = Boolean(emailMethod?.email);
  const knownEmail =
    user.email ??
    user.authMethods.find((m: AuthMethod) => Boolean(m.email))?.email ??
    "";
  // Only ask for an email when none is known yet (e.g. Telegram-only account).
  const needsEmailInput = !hasEmailLogin && !knownEmail;

  const [email, setEmail] = useState(knownEmail);
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError("");
    setSuccess(false);

    const targetEmail = (
      needsEmailInput ? email : (emailMethod?.email ?? knownEmail)
    )?.trim();
    if (!targetEmail) {
      setValidationError(t("auth.emailRequired"));
      return;
    }
    if (!PASSWORD_PATTERN.test(password)) {
      setValidationError(t("auth.passwordComplexity"));
      return;
    }

    update(
      { authMethods: [{ type: "EMAIL", email: targetEmail, password }] },
      {
        onSuccess: () => {
          setPassword("");
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
          }, 5000);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <span className="text-[13px] opacity-75">
        {hasEmailLogin
          ? t("auth.changePasswordTitle")
          : t("auth.createPasswordTitle")}
      </span>

      {needsEmailInput && (
        <input
          required
          type="email"
          value={email}
          placeholder={t("auth.email")}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          className="custom-input"
        />
      )}

      <div className="relative w-full">
        <input
          required
          minLength={8}
          type={isPasswordVisible ? "text" : "password"}
          value={password}
          placeholder={t("auth.newPassword")}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          className="custom-input pr-11"
        />
        <button
          type="button"
          aria-label={
            isPasswordVisible ? t("auth.hidePassword") : t("auth.showPassword")
          }
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

      <button type="submit" disabled={isUpdating} className="custom-btn">
        {isUpdating
          ? t("common.loading")
          : hasEmailLogin
            ? t("auth.changePassword")
            : t("auth.createPassword")}
      </button>

      {success && (
        <span className="text-green-500">{t("auth.passwordUpdated")}</span>
      )}
      {validationError && (
        <span className="text-red-500">{validationError}</span>
      )}
      {updateError && <span className="text-red-500">{updateError}</span>}
    </form>
  );
}
