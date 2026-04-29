import type {
  CreateUserBody as User,
  CreateAuthMethodBody,
} from "@fintrack/types";
import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface RegisterPopupFormProps {
  userLocalInfo: User;
  setUserLocalInfo: Dispatch<SetStateAction<User>>;
  isRegistering: boolean;
}

export function RegisterPopupForm({
  userLocalInfo,
  setUserLocalInfo,
  isRegistering,
}: RegisterPopupFormProps) {
  const { t } = useSafeTranslation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <>
      <input
        required
        value={userLocalInfo.name}
        type="text"
        placeholder={t("auth.name")}
        onChange={(e) =>
          setUserLocalInfo({
            ...userLocalInfo,
            name: e.target.value,
          })
        }
        className="custom-input"
      />
      <input
        type="url"
        value={userLocalInfo.photo_url || ""}
        placeholder={t("auth.photoUrlOptional")}
        onChange={(e) =>
          setUserLocalInfo({
            ...userLocalInfo,
            photo_url: e.target.value,
          })
        }
        className="custom-input"
      />
      <span className="h-[2px] w-full bg-(--color-background) rounded" />
      <div className="flex justify-between gap-[20px] text-center flex-col">
        <input
          required
          type="email"
          placeholder={t("auth.email")}
          value={
            userLocalInfo.authMethods.find(
              (m: CreateAuthMethodBody) => m.type === "EMAIL",
            )?.email || ""
          }
          onChange={(e) => {
            const newValue = e.target.value;
            setUserLocalInfo((prev: User) => ({
              ...prev,
              authMethods: prev.authMethods.map(
                (method: CreateAuthMethodBody) =>
                  method.type === "EMAIL"
                    ? { ...method, email: newValue }
                    : method,
              ),
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
            value={
              userLocalInfo.authMethods.find(
                (m: CreateAuthMethodBody) => m.type === "EMAIL",
              )?.password || ""
            }
            onChange={(e) => {
              const newValue = e.target.value;
              setUserLocalInfo((prev: User) => ({
                ...prev,
                authMethods: prev.authMethods.map(
                  (method: CreateAuthMethodBody) =>
                    method.type === "EMAIL"
                      ? { ...method, password: newValue }
                      : method,
                ),
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
        <input
          type="text"
          placeholder={t("auth.telegramOptional")}
          value={
            userLocalInfo.authMethods.find(
              (m: CreateAuthMethodBody) => m.type === "TELEGRAM",
            )?.telegram_id || ""
          }
          onChange={(e) => {
            const newValue = e.target.value;
            setUserLocalInfo((prev: User) => ({
              ...prev,
              authMethods: prev.authMethods.map(
                (method: CreateAuthMethodBody) =>
                  method.type === "TELEGRAM"
                    ? { ...method, telegram_id: newValue }
                    : method,
              ),
            }));
          }}
          className="custom-input"
        />
        <button type="submit" disabled={isRegistering} className="custom-btn">
          {t("auth.registerNewAccount")}
        </button>
      </div>
    </>
  );
}
