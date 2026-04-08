import bcrypt from "bcrypt";
import { prisma } from "../../prisma/client.js";
import * as userService from "../user/service.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { Prisma } from "@prisma/client";

const DUMMY_PASSWORD_HASH =
  "$2b$10$9QebfQfX8hS8GDYQz9G8vOhF8vwPUfY2K/BysI0h9M2v8a1FhLB2K";

export async function login(email: string, password: string) {
  const authMethod = await prisma.authMethod.findUnique({
    where: {
      email,
    },
  });

  const passwordHash = authMethod?.password_hash ?? DUMMY_PASSWORD_HASH;
  const isPasswordValid = await bcrypt.compare(password, passwordHash);
  if (!authMethod || !isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  if (isPasswordValid) {
    return await userService.getUser(authMethod.userId);
  }
  throw new AppError("Invalid credentials", 401);
}

export async function createSession(data: Prisma.SessionUncheckedCreateInput) {
  return prisma.session.create({ data });
}

export async function findSessionByTokenHash(tokenHash: string) {
  return prisma.session.findUnique({
    where: {
      tokenHash,
    },
  });
}

export async function findSessionById(sessionId: string) {
  return prisma.session.findUnique({
    where: {
      sessionId,
    },
    select: {
      sessionId: true,
      userId: true,
      revokedAt: true,
      expiresAt: true,
    },
  });
}

export async function rotateSession(
  currentSessionId: string,
  newSessionData: Prisma.SessionUncheckedCreateInput,
) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const revokeResult = await tx.session.updateMany({
      where: {
        sessionId: currentSessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        lastUsedAt: now,
      },
    });
    if (revokeResult.count !== 1) {
      throw new AppError("Refresh token reuse detected", 401);
    }

    return tx.session.create({
      data: newSessionData,
    });
  });
}

export async function revokeSession(sessionId: string, revokedAt = new Date()) {
  await prisma.session.update({
    where: {
      sessionId,
    },
    data: {
      revokedAt,
      lastUsedAt: revokedAt,
    },
  });
}

export async function revokeSessionFamily(
  familyId: string,
  revokedAt = new Date(),
) {
  await prisma.session.updateMany({
    where: {
      familyId,
      revokedAt: null,
    },
    data: {
      revokedAt,
      lastUsedAt: revokedAt,
    },
  });
}

export async function revokeAllUserSessions(
  userId: string,
  revokedAt = new Date(),
) {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt,
      lastUsedAt: revokedAt,
    },
  });
}

export async function markSessionUsed(sessionId: string) {
  await prisma.session.update({
    where: {
      sessionId,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });
}

export async function logoutByTokenHash(tokenHash: string) {
  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
  });

  if (!session) return null;
  await revokeSession(session.sessionId);
  return session;
}

export async function loginWithGoogle(params: {
  googleSub: string;
  email: string;
  name: string;
  photoUrl?: string | null;
}) {
  const { googleSub, email, name, photoUrl } = params;

  const existingGoogleMethod = await prisma.authMethod.findFirst({
    where: {
      type: "GOOGLE",
      google_sub: googleSub,
    },
  });

  if (existingGoogleMethod) {
    return userService.getUser(existingGoogleMethod.userId);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingEmailMethod = await prisma.authMethod.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingEmailMethod) {
    await prisma.authMethod.create({
      data: {
        type: "GOOGLE",
        // Keep email only in EMAIL auth method because AuthMethod.email is unique.
        // Google identity is bound by google_sub.
        email: null,
        password_hash: null,
        telegram_id: null,
        google_sub: googleSub,
        user: {
          connect: { id: existingEmailMethod.userId },
        },
      },
    });

    await prisma.user.update({
      where: { id: existingEmailMethod.userId },
      data: {
        isVerified: true,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      },
    });

    return userService.getUser(existingEmailMethod.userId);
  }

  const user = await prisma.user.create({
    data: {
      name,
      photo_url: photoUrl ?? null,
      isVerified: true,
      authMethods: {
        create: {
          type: "GOOGLE",
          email: null,
          password_hash: null,
          telegram_id: null,
          google_sub: googleSub,
        },
      },
    },
    include: {
      authMethods: {
        omit: {
          password_hash: true,
          userId: true,
        },
      },
    },
  });

  return user;
}
