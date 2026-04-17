import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

export function MonobankIntroPanel() {
  const { t } = useSafeTranslation();

  return (
    <div className="neo-panel neo-panel-glow p-[20px]">
      <h1 className="text-(--color-title) text-[30px] font-semibold">
        {t("monobank.title")}
      </h1>
      <p className="mt-[8px] text-(--color-fixed-text) text-[15px]">
        {t("monobank.safeInfo")}
      </p>
      <ul className="mt-[14px] list-disc space-y-[6px] pl-[20px] text-(--color-fixed-text) text-[14px]">
        <li>{t("monobank.rangeLimit")}</li>
        <li>{t("monobank.cooldownLimit")}</li>
        <li>
          {t("monobank.getTokenAt")}{" "}
          <a
            href="https://api.monobank.ua/"
            target="_blank"
            rel="noreferrer"
            className="text-(--color-hover) underline"
          >
            api.monobank.ua
          </a>
          .
        </li>
      </ul>
    </div>
  );
}
