"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { APP_BASE_PATH } from "@/config/constants";

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

export default function ResetPasswordPage() {
  const { t } = useSafeTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    actions: { resetPassword },
    status: { isResettingPassword, resetPasswordError },
  } = useAuth();

  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);
    if (!token) return;
    if (!isStrongPassword(password)) {
      setValidationError(t("auth.passwordComplexity"));
      return;
    }
    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => {
        router.push(`${APP_BASE_PATH}/login`);
      }, 2000);
    } catch {
      setSuccess(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] w-full items-center justify-center">
      <section className="w-full max-w-150 rounded-[10px] border border-(--color-fixed-text) bg-(--color-card) p-6">
        <h1 className="mb-5 text-center text-(--color-title) text-[32px] font-semibold">
          {t("auth.resetPasswordTitle")}
        </h1>

        {!token ? (
          <p className="text-center text-red-500">
            {t("auth.resetPasswordMissingToken")}
          </p>
        ) : success ? (
          <p className="text-center text-green-500">
            {t("auth.resetPasswordSuccess")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            <p className="text-sm text-(--color-text) opacity-80">
              {t("auth.resetPasswordHint")}
            </p>
            <div className="relative w-full">
              <input
                required
                minLength={8}
                type={isPasswordVisible ? "text" : "password"}
                placeholder={t("auth.newPassword")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                className="custom-input pr-11"
              />
              <button
                type="button"
                aria-label={
                  isPasswordVisible
                    ? t("auth.hidePassword")
                    : t("auth.showPassword")
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
            <button
              type="submit"
              disabled={isResettingPassword}
              className="custom-btn"
            >
              {isResettingPassword
                ? t("auth.resettingPassword")
                : t("auth.resetPasswordButton")}
            </button>
            {validationError && (
              <span className="text-red-500">{validationError}</span>
            )}
            {resetPasswordError && (
              <span className="text-red-500">{resetPasswordError}</span>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
