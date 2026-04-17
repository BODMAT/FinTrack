import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

let authLoading = false;
let sessionStatus: "authenticated" | "loading" | "unauthenticated" =
  "authenticated";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isLoading: authLoading }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: sessionStatus }),
}));

describe("ProtectedClientGate", () => {
  it("shows spinner while auth is loading", async () => {
    authLoading = true;
    sessionStatus = "authenticated";

    const { ProtectedClientGate } =
      await import("@/app/_components/auth/ProtectedClientGate");
    render(
      <ProtectedClientGate>
        <div>secret-content</div>
      </ProtectedClientGate>,
    );

    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("shows spinner while oauth session is loading", async () => {
    authLoading = false;
    sessionStatus = "loading";

    const { ProtectedClientGate } =
      await import("@/app/_components/auth/ProtectedClientGate");
    render(
      <ProtectedClientGate>
        <div>secret-content</div>
      </ProtectedClientGate>,
    );

    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("renders children when ready", async () => {
    authLoading = false;
    sessionStatus = "authenticated";

    const { ProtectedClientGate } =
      await import("@/app/_components/auth/ProtectedClientGate");
    render(
      <ProtectedClientGate>
        <div>secret-content</div>
      </ProtectedClientGate>,
    );

    expect(screen.getByText("secret-content")).toBeInTheDocument();
  });
});
