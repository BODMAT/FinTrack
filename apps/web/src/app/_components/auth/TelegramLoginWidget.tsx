"use client";

import { useEffect, useState } from "react";
import type { TelegramWidgetPayload } from "@fintrack/types";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { TelegramIcon } from "./AuthProviderIcons";

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        auth?: (
          options: { bot_id: string; request_access?: string },
          callback: (data: TelegramWidgetPayload | false) => void,
        ) => void;
      };
    };
  }
}

const TELEGRAM_WIDGET_SRC = "https://telegram.org/js/telegram-widget.js?22";

interface TelegramLoginWidgetProps {
  mode: "login" | "link";
  onAuth: (payload: TelegramWidgetPayload) => Promise<void>;
}

export function TelegramLoginWidget({
  mode,
  onAuth,
}: TelegramLoginWidgetProps) {
  const { t } = useSafeTranslation();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.Telegram?.Login?.auth === "function",
  );
  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;

  useEffect(() => {
    if (!botId || scriptReady) return;

    const markReady = () => {
      if (typeof window.Telegram?.Login?.auth === "function") {
        setScriptReady(true);
      } else {
        setError(t("auth.telegramScriptApiMissing"));
      }
    };

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${TELEGRAM_WIDGET_SRC}"]`,
    );

    if (script) {
      script.addEventListener("load", markReady);
      return () => script?.removeEventListener("load", markReady);
    }

    script = document.createElement("script");
    script.async = true;
    script.src = TELEGRAM_WIDGET_SRC;
    script.addEventListener("load", markReady);
    script.addEventListener("error", () => {
      setError(t("auth.telegramScriptFailed"));
    });
    document.body.appendChild(script);

    return () => script?.removeEventListener("load", markReady);
  }, [botId, scriptReady, t]);

  const handleClick = () => {
    if (typeof window.Telegram?.Login?.auth !== "function" || !botId) {
      setError(t("auth.telegramNotInitialized"));
      return;
    }
    setIsLoading(true);
    setError("");

    window.Telegram.Login.auth(
      { bot_id: botId, request_access: "write" },
      (data) => {
        setIsLoading(false);
        if (!data) {
          setError(t("auth.telegramAuthCancelled"));
          return;
        }
        void onAuth(data).catch((err: unknown) => {
          setError(
            err instanceof Error ? err.message : t("auth.telegramAuthFailed"),
          );
        });
      },
    );
  };

  if (!botId) return null;

  const content = mode === "login" ? "Telegram" : t("auth.linkTelegram");

  return (
    <div className="flex flex-1 flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={!scriptReady || isLoading}
        className="custom-btn flex items-center justify-center gap-2"
      >
        {isLoading ? (
          t("common.loading")
        ) : (
          <>
            <TelegramIcon />
            {content}
          </>
        )}
      </button>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
}
