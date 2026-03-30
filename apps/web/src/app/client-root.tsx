"use client";

import { Layout } from "../components/App/Layout";
import { PopUpPortal } from "../shared/portals/PopUp.portal";
import { Providers } from "./providers";

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Layout>{children}</Layout>
      <PopUpPortal />
    </Providers>
  );
}


