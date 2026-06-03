import mongoose from "mongoose";
import { AuditEventModel } from "./model.js";
import { logger } from "../../lib/logger.js";

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
    logger.error({ err }, "Audit: failed to log event");
  }
}
