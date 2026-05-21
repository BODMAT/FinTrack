import { redis } from "../redis.js";

export type TokenPair = { accessToken: string; refreshToken: string };

const key = (telegramId: number) => `bot:session:${telegramId}`;

// 30 days TTL – token pair is refreshed on each use
const TTL_SECONDS = 60 * 60 * 24 * 30;

export async function getTokens(telegramId: number): Promise<TokenPair | null> {
  const raw = await redis.get(key(telegramId));
  if (!raw) return null;
  return JSON.parse(raw) as TokenPair;
}

export async function setTokens(
  telegramId: number,
  tokens: TokenPair,
): Promise<void> {
  await redis.set(key(telegramId), JSON.stringify(tokens), "EX", TTL_SECONDS);
}

export async function deleteTokens(telegramId: number): Promise<void> {
  await redis.del(key(telegramId));
}

export async function hasTokens(telegramId: number): Promise<boolean> {
  return (await redis.exists(key(telegramId))) === 1;
}
