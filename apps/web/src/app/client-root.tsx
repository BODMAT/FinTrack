"use client";

import "@/shared/i18n/i18n";
import { AppLayout } from "./_components/layout/AppLayout";
import { LanguageBootstrap } from "./_components/auth/LanguageBootstrap";
import { OAuthBridge } from "./_components/auth/OAuthBridge";
import { AuthBootstrap } from "./_components/auth/AuthBootstrap";
import { PopUpPortal } from "@/shared/portals/PopUp.portal";
import { Providers } from "./providers";

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthBootstrap />
      <OAuthBridge />
      <LanguageBootstrap />
      <AppLayout>{children}</AppLayout>
      <PopUpPortal />
    </Providers>
  );
}
