import type { InlineKeyboard } from "grammy";

// Appends a ◀ Prev / Next ▶ row to an inline keyboard when there is more than
// one page. Callback data is `${prefix}:${targetPage}`. Returns true when a nav
// row was added (i.e. pagination is meaningful).
export function navRow(
  kb: InlineKeyboard,
  prefix: string,
  page: number,
  totalPages: number,
): boolean {
  if (!totalPages || totalPages <= 1) return false;
  if (page > 1) kb.text("◀ Prev", `${prefix}:${page - 1}`);
  if (page < totalPages) kb.text("Next ▶", `${prefix}:${page + 1}`);
  kb.row();
  return true;
}
