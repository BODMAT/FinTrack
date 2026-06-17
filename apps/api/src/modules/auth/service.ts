import bcrypt from "bcrypt";
import { prisma } from "../../prisma/client.js";
import * as userService from "../user/service.js";
import { AppError } from "../../middleware/errorHandler.js";
import { generateSecureToken, hashToken } from "../../utils/authSecurity.js";
import { logEvent } from "../audit/index.js";
import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";

const DUMMY_PASSWORD_HASH =
  "$2b$10$9QebfQfX8hS8GDYQz9G8vOhF8vwPUfY2K/BysI0h9M2v8a1FhLB2K";

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function login(email: string, password: string) {
  const authMethod = await prisma.authMethod.findUnique({
    where: {
      email,
    },
  });

  const passwordHash = authMethod?.password_hash ?? DUMMY_PASSWORD_HASH;
  const isPasswordValid = await bcrypt.compare(password, passwordHash);
  if (!authMethod || !isPasswordValid) {
    void logEvent("auth.login_failed", { method: "email" });
    throw new AppError("Invalid credentials", 401);
  }

  void logEvent("auth.login", { method: "email" }, authMethod.userId);
  return await userService.getUser(authMethod.userId);
}

export async function createSession(
  data: PrismaTypes.SessionUncheckedCreateInput,
) {
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
  newSessionData: PrismaTypes.SessionUncheckedCreateInput,
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
  void logEvent("auth.logout", {}, session.userId);
  return session;
}

export async function loginWithGoogle(params: {
  googleSub: string;
  email: string;
  name: string;
  photoUrl?: string | null;
}) {
  const { googleSub, email, name, photoUrl } = params;
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Existing Google auth method — return user directly
  const existingGoogleMethod = await prisma.authMethod.findFirst({
    where: {
      type: "GOOGLE",
      google_sub: googleSub,
    },
  });

  if (existingGoogleMethod) {
    void logEvent(
      "auth.login",
      { method: "google" },
      existingGoogleMethod.userId,
    );
    return userService.getUser(existingGoogleMethod.userId);
  }

  // 2. Existing EMAIL auth method with matching email — link Google to that account
  const existingEmailMethod = await prisma.authMethod.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingEmailMethod) {
    await prisma.authMethod.create({
      data: {
        type: "GOOGLE",
        // Keep email only in EMAIL auth method; AuthMethod.email is unique.
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
        // Ensure User.email is set for future cross-method dedup
        email: normalizedEmail,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      },
    });

    void logEvent(
      "auth.login",
      { method: "google" },
      existingEmailMethod.userId,
    );
    return userService.getUser(existingEmailMethod.userId);
  }

  // 3. User registered via Google before (User.email is set) but has no EMAIL AuthMethod.
  //    Prevents duplicate accounts when someone tries to register manually with the same email.
  const existingByPrimaryEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingByPrimaryEmail) {
    // Link Google sub to the existing user (e.g., they registered via Telegram + email before)
    await prisma.authMethod.create({
      data: {
        type: "GOOGLE",
        email: null,
        password_hash: null,
        telegram_id: null,
        google_sub: googleSub,
        user: { connect: { id: existingByPrimaryEmail.id } },
      },
    });

    await prisma.user.update({
      where: { id: existingByPrimaryEmail.id },
      data: {
        isVerified: true,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      },
    });

    void logEvent(
      "auth.login",
      { method: "google" },
      existingByPrimaryEmail.id,
    );
    return userService.getUser(existingByPrimaryEmail.id);
  }

  // 4. Brand-new Google user — create account and store primary email on User
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
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

  void logEvent("auth.login", { method: "google" }, user.id);
  return user;
}

// ── Email verification tokens ────────────────────────────────────────────────

export async function createEmailVerificationToken(
  userId: string,
): Promise<string> {
  // Purge any pre-existing tokens for this user before issuing a fresh one
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const token = generateSecureToken();
  const hash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: hash, expiresAt },
  });

  return token;
}

export async function consumeEmailVerificationToken(
  token: string,
): Promise<string> {
  const hash = hashToken(token);

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hash },
  });

  if (!record) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { tokenHash: hash } });
    throw new AppError("Verification token expired", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { isVerified: true },
    });
    await tx.emailVerificationToken.delete({ where: { tokenHash: hash } });
  });

  return record.userId;
}

export async function findVerificationTokenByUserId(userId: string) {
  return prisma.emailVerificationToken.findFirst({
    where: { userId, expiresAt: { gt: new Date() } },
  });
}

export async function findAuthMethodByEmail(email: string) {
  return prisma.authMethod.findUnique({ where: { email } });
}

export async function loginWithTelegram(telegramId: string, name: string) {
  const existing = await prisma.authMethod.findUnique({
    where: { telegram_id: telegramId },
  });

  if (existing) {
    void logEvent("auth.login", { method: "telegram" }, existing.userId);
    return userService.getUser(existing.userId);
  }

  const newUser = await prisma.user.create({
    data: {
      name,
      isVerified: true,
      authMethods: {
        create: {
          type: "TELEGRAM",
          telegram_id: telegramId,
        },
      },
    },
    include: {
      authMethods: {
        omit: { password_hash: true, userId: true },
      },
    },
  });
  void logEvent("auth.login", { method: "telegram" }, newUser.id);
  return newUser;
}

export async function linkTelegramToUser(params: {
  userId: string;
  telegramId: string;
}) {
  const { userId, telegramId } = params;

  const existingTelegramMethod = await prisma.authMethod.findUnique({
    where: { telegram_id: telegramId },
  });

  if (existingTelegramMethod) {
    if (existingTelegramMethod.userId === userId) {
      void logEvent("auth.telegram.link.idempotent", { telegramId }, userId);
      return userService.getUser(userId);
    }

    void logEvent("auth.telegram.link_conflict", { telegramId }, userId);
    throw new AppError("Telegram account is already linked", 409);
  }

  const currentTelegramMethod = await prisma.authMethod.findFirst({
    where: {
      userId,
      type: "TELEGRAM",
    },
  });

  if (currentTelegramMethod?.telegram_id) {
    void logEvent(
      "auth.telegram.link_conflict",
      { existingTelegramId: currentTelegramMethod.telegram_id },
      userId,
    );
    throw new AppError("User already has a linked Telegram account", 409);
  }

  try {
    await prisma.authMethod.create({
      data: {
        type: "TELEGRAM",
        telegram_id: telegramId,
        user: { connect: { id: userId } },
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError("Telegram account is already linked", 409);
    }
    throw err;
  }

  void logEvent("auth.telegram.linked", { telegramId }, userId);
  return userService.getUser(userId);
}
