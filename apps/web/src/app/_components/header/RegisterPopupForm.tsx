import type { CreateUserBody as User } from "@fintrack/types";
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
            userLocalInfo.authMethods.find((m) => m.type === "EMAIL")?.email ||
            ""
          }
          onChange={(e) => {
            const newValue = e.target.value;
            setUserLocalInfo((prev) => ({
              ...prev,
              authMethods: prev.authMethods.map((method) =>
                method.type === "EMAIL"
                  ? { ...method, email: newValue }
                  : method,
              ),
            }));
          }}
          className="custom-input"
        />
        <input
          required
          minLength={8}
          type="password"
          placeholder={t("auth.password")}
          value={
            userLocalInfo.authMethods.find((m) => m.type === "EMAIL")
              ?.password || ""
          }
          onChange={(e) => {
            const newValue = e.target.value;
            setUserLocalInfo((prev) => ({
              ...prev,
              authMethods: prev.authMethods.map((method) =>
                method.type === "EMAIL"
                  ? { ...method, password: newValue }
                  : method,
              ),
            }));
          }}
          className="custom-input"
        />
        <input
          type="text"
          placeholder={t("auth.telegramOptional")}
          value={
            userLocalInfo.authMethods.find((m) => m.type === "TELEGRAM")
              ?.telegram_id || ""
          }
          onChange={(e) => {
            const newValue = e.target.value;
            setUserLocalInfo((prev) => ({
              ...prev,
              authMethods: prev.authMethods.map((method) =>
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
