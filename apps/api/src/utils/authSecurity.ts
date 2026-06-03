import crypto from "crypto";
import { logEvent } from "../modules/audit/index.js";
import { getLogger } from "../lib/logger.js";

export function generateSecureToken(size = 48): string {
  return crypto.randomBytes(size).toString("base64url");
}

export function generateFamilyId(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function extractClientIp(raw: string | undefined): string | null {
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim();
  return first || null;
}

export function logSecurityEvent(
  event: string,
  details: Record<string, unknown> = {},
) {
  getLogger().info({ event, ...details }, "security");
  void logEvent(
    `security.${event}`,
    details,
    details.userId as string | undefined,
  );
}
