"use client";

import { LoginPopup } from "../../../components/Header/LoginPopup";

export default function LoginPage() {
  return (
    <section className="mx-auto w-full max-w-[600px] rounded-[10px] border-1 border-[var(--color-fixed-text)] bg-[var(--color-card)] p-6">
      <h1 className="mb-5 text-center text-[var(--color-title)] text-[32px] font-semibold">
        Login
      </h1>
      <LoginPopup />
    </section>
  );
}
