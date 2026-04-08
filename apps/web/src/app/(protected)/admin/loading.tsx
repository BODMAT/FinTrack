"use client";

import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

export default function AdminLoading() {
  const { t } = useSafeTranslation();

  return <div className="neo-panel p-[20px]">{t("admin.loadingPanel")}</div>;
}
