"use client";

import { LoginPopup } from "../../_components/header/LoginPopup";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

export default function LoginPage() {
  const { t } = useSafeTranslation();

  return (
    <section className="mx-auto w-full max-w-150 rounded-[10px] border border-(--color-fixed-text) bg-(--color-card) p-6">
      <h1 className="mb-5 text-center text-(--color-title) text-[32px] font-semibold">
        {t("auth.loginTitle")}
      </h1>
      <LoginPopup />
    </section>
  );
}
