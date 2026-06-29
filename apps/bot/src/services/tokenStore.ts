import { redis } from "../lib/redis.js";

export type TokenPair = { accessToken: string; refreshToken: string };
export type StoredSession = TokenPair & { name: string };

const key = (telegramId: number) => `bot:session:${telegramId}`;

// 30 days TTL – tokens are re-exchanged on expiry, name lets us mint a fresh pair
const TTL_SECONDS = 60 * 60 * 24 * 30;

export async function getTokens(
  telegramId: number,
): Promise<StoredSession | null> {
  const raw = await redis.get(key(telegramId));
  if (!raw) return null;
  return JSON.parse(raw) as StoredSession;
}

export async function setTokens(
  telegramId: number,
  tokens: TokenPair,
  name: string,
): Promise<void> {
  const session: StoredSession = { ...tokens, name };
  await redis.set(key(telegramId), JSON.stringify(session), "EX", TTL_SECONDS);
}

export async function deleteTokens(telegramId: number): Promise<void> {
  await redis.del(key(telegramId));
}

export async function hasTokens(telegramId: number): Promise<boolean> {
  return (await redis.exists(key(telegramId))) === 1;
}
