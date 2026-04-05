import crypto from "crypto";

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
  console.info(
    JSON.stringify({
      level: "security",
      event,
      at: new Date().toISOString(),
      ...details,
    }),
  );
}
