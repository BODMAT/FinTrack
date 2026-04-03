import { prisma } from "../../prisma/client.js";
import { encryptApiKey, decryptApiKey } from "../../utils/crypto.js";
import type { AiProvider } from "@prisma/client";

function maskKey(key: string): string {
  return key.slice(0, 6) + "••••••••" + key.slice(-4);
}

export async function getUserApiKeys(userId: string) {
  const keys = await prisma.userApiKey.findMany({ where: { userId } });
  return keys.map((k) => ({
    id: k.id,
    provider: k.provider,
    isActive: k.isActive,
    maskedKey: maskKey(decryptApiKey(k.apiKey)),
    createdAt: k.createdAt,
    updatedAt: k.updatedAt,
  }));
}

export async function upsertUserApiKey(
  userId: string,
  provider: AiProvider,
  apiKey: string,
) {
  const encrypted = encryptApiKey(apiKey);
  const key = await prisma.userApiKey.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, apiKey: encrypted, isActive: true },
    update: { apiKey: encrypted, isActive: true },
  });
  return {
    id: key.id,
    provider: key.provider,
    isActive: key.isActive,
    maskedKey: maskKey(apiKey),
  };
}

export async function deleteUserApiKey(userId: string, provider: AiProvider) {
  await prisma.userApiKey.deleteMany({ where: { userId, provider } });
}

export async function toggleUserApiKey(userId: string, provider: AiProvider) {
  const existing = await prisma.userApiKey.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!existing) return null;
  return prisma.userApiKey.update({
    where: { id: existing.id },
    data: { isActive: !existing.isActive },
    select: { isActive: true, provider: true },
  });
}
