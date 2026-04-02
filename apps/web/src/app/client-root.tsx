"use client";

import "@/shared/i18n/i18n";
import { AppLayout } from "./_components/layout/AppLayout";
import { AuthCookieSync } from "./_components/auth/AuthCookieSync";
import { LanguageBootstrap } from "./_components/auth/LanguageBootstrap";
import { PopUpPortal } from "@/shared/portals/PopUp.portal";
import { Providers } from "./providers";

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthCookieSync />
      <LanguageBootstrap />
      <AppLayout>{children}</AppLayout>
      <PopUpPortal />
    </Providers>
  );
}
