import { config } from "../config.js";

const { API_URL } = config;

type TokenPair = { accessToken: string; refreshToken: string };

const tokenStore = new Map<number, TokenPair>();

async function apiFetch(
  method: string,
  path: string,
  telegramId: number,
  body?: unknown,
): Promise<Response> {
  const tokens = tokenStore.get(telegramId);

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401 && tokens) {
    const refreshed = await tryRefresh(telegramId, tokens.refreshToken);
    if (refreshed) {
      return apiFetch(method, path, telegramId, body);
    }
  }

  return res;
}

async function tryRefresh(
  telegramId: number,
  refreshToken: string,
): Promise<boolean> {
  const res = await fetch(`${API_URL}/auth/telegram/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    tokenStore.delete(telegramId);
    return false;
  }

  const data = (await res.json()) as TokenPair;
  tokenStore.set(telegramId, data);
  return true;
}

export async function authenticateUser(
  telegramId: number,
  name: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/auth/telegram/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: String(telegramId), name }),
  });

  if (!res.ok) {
    throw new Error(`Telegram auth failed: ${res.status}`);
  }

  const data = (await res.json()) as TokenPair;
  tokenStore.set(telegramId, data);
}

export function isAuthenticated(telegramId: number): boolean {
  return tokenStore.has(telegramId);
}

export const api = {
  get: (telegramId: number, path: string) => apiFetch("GET", path, telegramId),
  post: (telegramId: number, path: string, body: unknown) =>
    apiFetch("POST", path, telegramId, body),
  put: (telegramId: number, path: string, body: unknown) =>
    apiFetch("PUT", path, telegramId, body),
  delete: (telegramId: number, path: string) =>
    apiFetch("DELETE", path, telegramId),
};
