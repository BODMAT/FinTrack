"use client";

import type { AiErrorCode } from "@/types/ai";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { usePopupStore } from "@/store/popup";
import { ApiKeyPopup } from "./ApiKeyPopup";

const ERROR_CONFIG: Record<
  AiErrorCode,
  { icon: string; titleKey: string; descKey: string; showAddKey: boolean }
> = {
  USER_KEY_LIMIT: {
    icon: "!",
    titleKey: "errors.aiKeyLimit",
    descKey: "errors.aiKeyLimitDesc",
    showAddKey: false,
  },
  USER_KEY_INVALID: {
    icon: "!",
    titleKey: "errors.aiKeyInvalid",
    descKey: "errors.aiKeyInvalidDesc",
    showAddKey: true,
  },
  DEFAULT_KEY_LIMIT: {
    icon: "!",
    titleKey: "errors.aiDefaultLimit",
    descKey: "errors.aiDefaultLimitDesc",
    showAddKey: true,
  },
  ALL_KEYS_FAILED: {
    icon: "!",
    titleKey: "errors.aiAllFailed",
    descKey: "errors.aiAllFailedDesc",
    showAddKey: true,
  },
  USING_DEFAULT_KEY: {
    icon: "!",
    titleKey: "errors.aiUsingDefault",
    descKey: "errors.aiUsingDefaultDesc",
    showAddKey: true,
  },
};

export function AiErrorPopup({ code }: { code: AiErrorCode }) {
  const { t } = useSafeTranslation();
  const { close, open } = usePopupStore();
  const config = ERROR_CONFIG[code];

  const handleOpenApiKeyPopup = () => {
    close();
    setTimeout(() => {
      open(t("analytics.addApiKey"), <ApiKeyPopup />);
    }, 300);
  };

  return (
    <section className="flex w-full flex-col items-center gap-5 py-2 text-center text-(--color-text)">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-(--color-fixed-text) bg-(--color-background) text-3xl font-bold text-(--color-hover)">
        {config.icon}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-semibold text-(--color-text)">
          {t(config.titleKey)}
        </h3>
        <p className="max-w-[520px] text-sm leading-relaxed text-(--color-fixed-text)">
          {t(config.descKey)}
        </p>
      </div>

      <div className="flex gap-3 max-sm:w-full max-sm:flex-col">
        {config.showAddKey && (
          <button
            type="button"
            onClick={handleOpenApiKeyPopup}
            className="custom-btn"
          >
            {t("analytics.addApiKey")}
          </button>
        )}
        <button type="button" onClick={close} className="custom-btn">
          {t("common.close")}
        </button>
      </div>
    </section>
  );
}
