"use client";

import { LoginPopup } from "../../_components/header/LoginPopup";

export default function LoginPage() {
  return (
    <section className="mx-auto w-full max-w-[600px] rounded-[10px] border border-(--color-fixed-text) bg-(--color-card) p-[24px]">
      <h1 className="mb-[20px] text-center text-(--color-title) text-[32px] font-semibold">
        Login
      </h1>
      <LoginPopup />
    </section>
  );
}


