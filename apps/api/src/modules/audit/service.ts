import mongoose from "mongoose";
import { AuditEventModel } from "./model.js";

export async function logEvent(
  type: string,
  payload: Record<string, unknown> = {},
  userId?: string,
) {
  if (mongoose.connection.readyState !== 1) return;
  try {
    await AuditEventModel.create({
      type,
      payload,
      ...(userId ? { userId } : {}),
    });
  } catch (err) {
    console.error("[Audit] failed to log event:", err);
  }
}
