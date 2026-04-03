import crypto from "crypto";
import { ENV } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const KEY = crypto
  .createHash("sha256")
  .update(ENV.API_KEY_ENCRYPTION_SECRET)
  .digest(); // 32 bytes

export function encryptApiKey(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // iv:tag:encrypted (base64)
  return [iv, tag, encrypted].map((b) => b.toString("base64")).join(":");
}

export function decryptApiKey(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format");
  }
  const [ivB64, tagB64, encB64] = parts as [string, string, string];

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(encB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}
