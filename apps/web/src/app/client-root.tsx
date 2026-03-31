"use client";

import { AppLayout } from "./_components/layout/AppLayout";
import { AuthCookieSync } from "./_components/auth/AuthCookieSync";
import { PopUpPortal } from "@/shared/portals/PopUp.portal";
import { Providers } from "./providers";

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthCookieSync />
      <AppLayout>{children}</AppLayout>
      <PopUpPortal />
    </Providers>
  );
}




