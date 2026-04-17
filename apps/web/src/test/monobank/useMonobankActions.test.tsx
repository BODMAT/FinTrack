import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactElement } from "react";
import { useMonobankActions } from "@/app/(protected)/monobank/_components/useMonobankActions";

const t = (key: string, options?: Record<string, unknown>) =>
  `${key}${options ? JSON.stringify(options) : ""}`;

describe("useMonobankActions", () => {
  it("validates short token and stops request", async () => {
    const setTokenError = vi.fn();
    const fetchMonobankAccountsData = vi.fn();

    const { result } = renderHook(() =>
      useMonobankActions({
        token: "short-token",
        transactions: [],
        isCooldownActive: false,
        remainingSeconds: 0,
        fetchMonobankAccountsData,
        fetchMonobankData: vi.fn(),
        importMonobankData: vi.fn(),
        deleteMonobankData: vi.fn(),
        startCooldown: vi.fn(),
        setTokenError,
        setPreviewTransactions: vi.fn(),
        open: vi.fn(),
        close: vi.fn(),
        t,
      }),
    );

    await act(async () => {
      await result.current.handleFetchAccounts({
        preventDefault: vi.fn(),
      } as never);
    });

    expect(setTokenError).toHaveBeenCalledWith("monobank.tokenInvalid");
    expect(fetchMonobankAccountsData).not.toHaveBeenCalled();
  });

  it("respects cooldown and does not call API", async () => {
    const setTokenError = vi.fn();
    const fetchMonobankAccountsData = vi.fn();

    const { result } = renderHook(() =>
      useMonobankActions({
        token: "12345678901234567890",
        transactions: [],
        isCooldownActive: true,
        remainingSeconds: 37,
        fetchMonobankAccountsData,
        fetchMonobankData: vi.fn(),
        importMonobankData: vi.fn(),
        deleteMonobankData: vi.fn(),
        startCooldown: vi.fn(),
        setTokenError,
        setPreviewTransactions: vi.fn(),
        open: vi.fn(),
        close: vi.fn(),
        t,
      }),
    );

    await act(async () => {
      await result.current.handleFetchAccounts({
        preventDefault: vi.fn(),
      } as never);
    });

    expect(setTokenError).toHaveBeenCalledWith(
      `monobank.waitBeforeRequest${JSON.stringify({ seconds: 37 })}`,
    );
    expect(fetchMonobankAccountsData).not.toHaveBeenCalled();
  });

  it("runs account->import flow and reports success", async () => {
    const open = vi.fn();
    const close = vi.fn();
    const fetchMonobankAccountsData = vi.fn().mockResolvedValue({
      accounts: [{ id: "acc-1", currencyCode: 980 }],
    });
    const fetchMonobankData = vi.fn().mockResolvedValue({
      transactions: [
        {
          sourceTransactionId: "tx-1",
          title: "Salary",
          type: "INCOME",
          amount: 100,
          currencyCode: "USD",
          created_at: new Date("2026-04-10T10:00:00.000Z"),
          source: "MONOBANK",
          sourceAccountId: "acc-1",
        },
      ],
    });
    const importMonobankData = vi.fn().mockResolvedValue({
      imported: 1,
      skipped: 0,
    });
    const setPreviewTransactions = vi.fn();

    const { result } = renderHook(() =>
      useMonobankActions({
        token: "12345678901234567890",
        transactions: [],
        isCooldownActive: false,
        remainingSeconds: 0,
        fetchMonobankAccountsData,
        fetchMonobankData,
        importMonobankData,
        deleteMonobankData: vi.fn(),
        startCooldown: vi.fn(),
        setTokenError: vi.fn(),
        setPreviewTransactions,
        open,
        close,
        t,
      }),
    );

    await act(async () => {
      await result.current.handleFetchAccounts({
        preventDefault: vi.fn(),
      } as never);
    });

    expect(fetchMonobankAccountsData).toHaveBeenCalledWith({
      token: "12345678901234567890",
    });

    const firstPopup = open.mock.calls[0]?.[1] as ReactElement<{
      onContinue: (params: {
        accountId: string;
        accountCurrencyCode?: number;
        mode: "IMPORT" | "PREVIEW";
      }) => Promise<void>;
    }>;

    await act(async () => {
      await firstPopup.props.onContinue({
        accountId: "acc-1",
        accountCurrencyCode: 980,
        mode: "IMPORT",
      });
    });

    expect(close).toHaveBeenCalled();
    expect(fetchMonobankData).toHaveBeenCalled();
    expect(importMonobankData).toHaveBeenCalled();
    expect(setPreviewTransactions).toHaveBeenCalled();
    expect(open).toHaveBeenLastCalledWith(
      "monobank.importCompleted",
      expect.anything(),
    );
  });
});
