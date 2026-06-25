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
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const PASSWORD_SALT_ROUNDS = 10;

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

// ── Password reset tokens ─────────────────────────────────────────────────────

/**
 * Issues a password reset token for the account behind `email`.
 * Resolves the user via the EMAIL auth method first, then falls back to the
 * primary User.email (covers Google/Telegram-first accounts that set a
 * recovery email). Returns null when no account is found so the controller
 * can respond identically and avoid leaking which emails are registered.
 */
export async function createPasswordResetToken(
  email: string,
): Promise<{ token: string; userId: string; name: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const authMethod = await prisma.authMethod.findUnique({
    where: { email: normalizedEmail },
    include: { user: { select: { id: true, name: true } } },
  });

  let user = authMethod?.user ?? null;
  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true },
    });
  }

  if (!user) return null;

  // Purge any pre-existing tokens for this user before issuing a fresh one
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = generateSecureToken();
  const hash = hashToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt },
  });

  void logEvent("auth.password_reset.requested", {}, user.id);
  return { token, userId: user.id, name: user.name };
}

/**
 * Consumes a password reset token and sets a new password on the user's EMAIL
 * auth method. If the user has no EMAIL method (e.g. registered via Google with
 * a recovery email), one is created using the known User.email. All existing
 * sessions are revoked so a leaked password can't keep an attacker signed in.
 */
export async function consumePasswordResetToken(
  token: string,
  newPassword: string,
): Promise<string> {
  const hash = hashToken(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hash },
  });

  if (!record) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { tokenHash: hash } });
    throw new AppError("Reset token expired", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    const emailMethod = await tx.authMethod.findFirst({
      where: { userId: record.userId, type: "EMAIL" },
    });

    if (emailMethod) {
      await tx.authMethod.update({
        where: { id: emailMethod.id },
        data: { password_hash: passwordHash },
      });
    } else {
      const user = await tx.user.findUnique({
        where: { id: record.userId },
        select: { email: true },
      });
      if (!user?.email) {
        throw new AppError(
          "Cannot reset password: no email is associated with this account",
          400,
        );
      }
      await tx.authMethod.create({
        data: {
          type: "EMAIL",
          email: user.email,
          password_hash: passwordHash,
          user: { connect: { id: record.userId } },
        },
      });
    }

    await tx.passwordResetToken.delete({ where: { tokenHash: hash } });
  });

  // Invalidate every active session after a password change.
  await revokeAllUserSessions(record.userId);

  void logEvent("auth.password_reset.completed", {}, record.userId);
  return record.userId;
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
