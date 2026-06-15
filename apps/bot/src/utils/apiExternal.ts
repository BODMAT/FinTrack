import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../context.js";

export type ExternalResult = { ok: boolean; status: number } | { error: true };

// Runs an api call inside conversation.external and returns a replay-safe,
// serializable result. A Response object is never returned to the conversation
// (it can't be serialized for replay) — only its ok/status are read.
export async function callExternal(
  conversation: Conversation<MyContext, MyContext>,
  fn: () => Promise<Response>,
): Promise<ExternalResult> {
  try {
    return await conversation.external(async () => {
      const r = await fn();
      return { ok: r.ok, status: r.status };
    });
  } catch {
    return { error: true };
  }
}
