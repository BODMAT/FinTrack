import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import bcrypt from "bcrypt";
import * as userService from "./service.js";
import * as authService from "../auth/service.js";
import { clearAuthCookies } from "../auth/controller.js";
import { AppError } from "../../middleware/errorHandler.js";
import { logSecurityEvent } from "../../utils/authSecurity.js";
import { sendVerificationEmail } from "../../utils/mailer.js";
import { logger } from "../../lib/logger.js";
import {
  CreateUserSchema as createUserSchema,
  UpdateUserSchema as updateUserSchema,
  type CreateAuthMethodBody,
  type UpdateAuthMethodBody,
} from "@fintrack/types";

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError("User ID is required", 400);
    if (Array.isArray(id)) {
      throw new AppError("Invalid id", 400);
    }
    const user = await userService.getUser(id);
    if (!user) throw new AppError("Not found", 404);

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.user?.id;
    if (!id) throw new AppError("Unauthorized", 401);

    const user = await userService.getUser(id);
    if (!user) throw new AppError("Not found", 404);

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedBody = createUserSchema.parse(req.body);
    const saltRounds = 10;
    const hasEmailAuth = validatedBody.authMethods.some(
      (m: CreateAuthMethodBody) => m.type === "EMAIL",
    );

    const authMethodsWithHash = await Promise.all(
      validatedBody.authMethods.map(async (method: CreateAuthMethodBody) => {
        if (method.type === "EMAIL") {
          if (!isStrongPassword(method.password)) {
            throw new AppError(
              "Password must contain uppercase, lowercase letters and a number",
              400,
            );
          }

          return {
            type: "EMAIL" as const,
            email: method.email.trim().toLowerCase(),
            password_hash: await bcrypt.hash(method.password, saltRounds),
            telegram_id: null,
          };
        }

        return {
          type: "TELEGRAM" as const,
          email: null,
          password_hash: null,
          telegram_id: method.telegram_id,
        };
      }),
    );

    // Prevent duplicate accounts: check User.email which catches both
    // email-first and Google-first registrations
    const primaryEmail = hasEmailAuth
      ? (authMethodsWithHash.find((m) => m.type === "EMAIL")?.email ?? null)
      : null;

    if (primaryEmail) {
      const conflict = await userService.findUserByEmail(primaryEmail);
      if (conflict) {
        throw new AppError("An account with this email already exists", 409);
      }
    }

    // EMAIL signups always require verification (both dev and prod).
    const isVerifiedOnCreate = hasEmailAuth ? false : true;

    const prismaData: Prisma.UserCreateInput = {
      name: validatedBody.name,
      email: primaryEmail,
      photo_url: validatedBody.photo_url ?? null,
      isVerified: isVerifiedOnCreate,
      ...(validatedBody.created_at
        ? { created_at: validatedBody.created_at }
        : {}),
      ...(validatedBody.updated_at
        ? { updated_at: validatedBody.updated_at }
        : {}),
      authMethods: {
        create: authMethodsWithHash,
      },
    };

    const user = await userService.createUser(prismaData);

    // Send verification email for email-registered users
    if (hasEmailAuth && primaryEmail && !isVerifiedOnCreate) {
      try {
        const verificationToken =
          await authService.createEmailVerificationToken(user.id);
        await sendVerificationEmail(primaryEmail, verificationToken, user.name);
      } catch (mailErr) {
        // Non-fatal: user can request resend
        logger.error(
          { err: mailErr },
          "createUser: failed to send verification email",
        );
      }
    }

    logSecurityEvent("auth.registration.success", {
      userId: user.id,
      isVerified: user.isVerified,
    });
    res.status(201).json(user);
  } catch (err) {
    logSecurityEvent("auth.registration.failed", { ip: req.ip });
    next(err);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError("User ID is required", 400);
    if (Array.isArray(id)) {
      throw new AppError("Invalid id", 400);
    }

    const validatedBody = updateUserSchema.parse(req.body);

    const prismaData: Prisma.UserUpdateInput = {};
    if (validatedBody.name !== undefined) prismaData.name = validatedBody.name;
    if (validatedBody.photo_url !== undefined)
      prismaData.photo_url = validatedBody.photo_url;
    if (validatedBody.created_at !== undefined)
      prismaData.created_at = validatedBody.created_at;
    if (validatedBody.updated_at !== undefined)
      prismaData.updated_at = validatedBody.updated_at;

    const validatedAuthMethods: {
      type: "EMAIL" | "TELEGRAM";
      email?: string;
      password?: string;
      telegram_id?: string;
    }[] =
      validatedBody.authMethods?.map((m: UpdateAuthMethodBody) => {
        if (m.type === "EMAIL") {
          if (m.password && !isStrongPassword(m.password)) {
            throw new AppError(
              "Password must contain uppercase, lowercase letters and a number",
              400,
            );
          }
          return {
            type: "EMAIL" as const,
            ...(m.email && { email: m.email.trim().toLowerCase() }),
            ...(m.password && { password: m.password }),
          };
        }
        return {
          type: "TELEGRAM" as const,
          telegram_id: m.telegram_id,
        };
      }) ?? [];

    await prisma.$transaction(async (tx) => {
      await userService.updateUser(tx, id, prismaData);

      if (validatedBody.authMethods) {
        await userService.updateUserAuthMethods(tx, id, validatedAuthMethods);
      }
    });

    const updatedUser = await userService.getUser(id);
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
}

export async function updateCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.user?.id;
    if (!id) throw new AppError("Unauthorized", 401);

    const validatedBody = updateUserSchema.parse(req.body);

    const prismaData: Prisma.UserUpdateInput = {};
    if (validatedBody.name !== undefined) prismaData.name = validatedBody.name;
    if (validatedBody.photo_url !== undefined)
      prismaData.photo_url = validatedBody.photo_url;
    if (validatedBody.created_at !== undefined)
      prismaData.created_at = validatedBody.created_at;
    if (validatedBody.updated_at !== undefined)
      prismaData.updated_at = validatedBody.updated_at;

    const validatedAuthMethods: {
      type: "EMAIL" | "TELEGRAM";
      email?: string;
      password?: string;
      telegram_id?: string;
    }[] =
      validatedBody.authMethods?.map((m: UpdateAuthMethodBody) => {
        if (m.type === "EMAIL") {
          if (m.password && !isStrongPassword(m.password)) {
            throw new AppError(
              "Password must contain uppercase, lowercase letters and a number",
              400,
            );
          }
          return {
            type: "EMAIL" as const,
            ...(m.email && { email: m.email.trim().toLowerCase() }),
            ...(m.password && { password: m.password }),
          };
        }
        return {
          type: "TELEGRAM" as const,
          telegram_id: m.telegram_id,
        };
      }) ?? [];

    await prisma.$transaction(async (tx) => {
      await userService.updateUser(tx, id, prismaData);

      if (validatedBody.authMethods) {
        await userService.updateUserAuthMethods(tx, id, validatedAuthMethods);
      }
    });

    const updatedUser = await userService.getUser(id);
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError("User ID is required", 400);
    if (Array.isArray(id)) {
      throw new AppError("Invalid user id", 400);
    }

    await userService.deleteUser(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export async function deleteCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.user?.id;
    if (!id) throw new AppError("Unauthorized", 401);

    await userService.deleteUser(id);
    clearAuthCookies(res);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export async function deleteAuthMethod(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, authMethodId } = req.params;
    if (!userId) throw new AppError("User ID is required", 400);
    if (Array.isArray(userId)) {
      throw new AppError("Invalid user id", 400);
    }
    if (!authMethodId) throw new AppError("Auth Method ID is required", 400);
    if (Array.isArray(authMethodId)) {
      throw new AppError("Invalid auth method id", 400);
    }

    await userService.deleteAuthMethod(userId, authMethodId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export async function deleteAuthMethodForCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    const { authMethodId } = req.params;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (!authMethodId) throw new AppError("Auth Method ID is required", 400);
    if (Array.isArray(authMethodId)) {
      throw new AppError("Invalid auth method id", 400);
    }

    await userService.deleteAuthMethod(userId, authMethodId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}
