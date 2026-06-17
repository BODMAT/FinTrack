import { InlineKeyboard } from "grammy";
import { api } from "../services/apiClient.js";
import { PER_PAGE, navRow } from "./pagination.js";
import { txLabel } from "./txLabel.js";
import type { HistoryResponse } from "../commands/history.format.js";

export type Picker = { text: string; keyboard: InlineKeyboard };
// "error" = load failed; null = nothing actionable on this page.
export type PickerResult = Picker | null | "error";

export type PickerConfig = {
  itemPrefix: string; // callback for an item → `${itemPrefix}:${id}`
  navPrefix: string; // callback for nav → `${navPrefix}:${page}`
  verb: string;
  emoji: string;
};

export async function buildTransactionPicker(
  telegramId: number,
  page: number,
  cfg: PickerConfig,
): Promise<PickerResult> {
  const res = await api.get(
    telegramId,
    `/transactions?page=${page}&perPage=${PER_PAGE}`,
  );
  if (!res.ok) return "error";

  const data = (await res.json()) as HistoryResponse;
  // Monobank transactions are read-only — never list them in the picker.
  const actionable = (data.data ?? []).filter((tx) => tx.source !== "MONOBANK");
  if (actionable.length === 0) return null;

  const kb = new InlineKeyboard();
  for (const tx of actionable) {
    kb.text(txLabel(tx), `${cfg.itemPrefix}:${tx.id}`).row();
  }

  const p = data.pagination;
  const curPage = p?.page ?? 1;
  const totalPages = p?.totalPages ?? 1;
  navRow(kb, cfg.navPrefix, curPage, totalPages);

  return {
    text: `${cfg.emoji} Pick a transaction to ${cfg.verb} (page ${curPage}/${totalPages}):`,
    keyboard: kb,
  };
}
