import { ENV } from "../../config/env.js";
import type { CookieOptions, Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../../types/jwt.js";
import { AppError } from "../../middleware/errorHandler.js";
import * as authService from "./service.js";
import { LoginUserBodySchema } from "@fintrack/types";
import {
  extractClientIp,
  generateFamilyId,
  generateSecureToken,
  hashToken,
  logSecurityEvent,
} from "../../utils/authSecurity.js";
import * as userService from "../user/service.js";

// Controllers
const { ACCESS_TOKEN_SECRET } = ENV;
const ACCESS_TOKEN_COOKIE = "fintrack_access_token";
const REFRESH_TOKEN_COOKIE = "fintrack_refresh_token";
const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_DAYS = 7;

const isProduction = ENV.NODE_ENV === "production";
const cookieBaseOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshExpiresAt: Date,
) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...cookieBaseOptions,
    maxAge: ACCESS_TOKEN_TTL * 1000,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieBaseOptions,
    expires: refreshExpiresAt,
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, cookieBaseOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieBaseOptions);
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

function getRefreshTokenFromRequest(req: Request): string | null {
  const fromCookie = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (typeof fromCookie === "string" && fromCookie.length > 0)
    return fromCookie;
  const fromBody = req.body?.token;
  if (typeof fromBody === "string" && fromBody.length > 0) return fromBody;

  return null;
}

function buildPayload(
  user: NonNullable<Awaited<ReturnType<typeof userService.getUser>>>,
): JwtPayload {
  return {
    id: user.id,
    email: user.authMethods.find((m) => m.type === "EMAIL")?.email ?? null,
    telegram_id:
      user.authMethods.find((m) => m.type === "TELEGRAM")?.telegram_id ?? null,
    role: user.role,
    isVerified: user.isVerified,
  };
}

async function issueUserSession(
  req: Request,
  res: Response,
  userId: string,
  payload: JwtPayload,
) {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateSecureToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpirationDate = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await authService.createSession({
    tokenHash: refreshTokenHash,
    familyId: generateFamilyId(),
    expiresAt: refreshTokenExpirationDate,
    userAgent: req.headers["user-agent"]?.slice(0, 512) || null,
    ip:
      extractClientIp(req.headers["x-forwarded-for"] as string | undefined) ||
      req.ip ||
      null,
    lastUsedAt: new Date(),
    userId,
  });

  setAuthCookies(res, accessToken, refreshToken, refreshTokenExpirationDate);
}

const GoogleTokenInfoSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  email_verified: z.union([z.literal("true"), z.literal("false")]),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  aud: z.string(),
});

async function verifyGoogleToken(idToken: string) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!response.ok) {
    throw new AppError("Invalid Google token", 401);
  }
  const rawData: unknown = await response.json();
  const parsed = GoogleTokenInfoSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new AppError("Invalid Google token payload", 401);
  }
  if (ENV.GOOGLE_CLIENT_ID && parsed.data.aud !== ENV.GOOGLE_CLIENT_ID) {
    throw new AppError("Invalid Google token audience", 401);
  }
  if (parsed.data.email_verified !== "true") {
    throw new AppError("Google email is not verified", 401);
  }
  return parsed.data;
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = LoginUserBodySchema.parse(req.body);
    const user = await authService.login(email, password);
    if (!user) throw new AppError("Invalid credentials", 401);
    if (ENV.NODE_ENV === "production" && !user.isVerified) {
      throw new AppError("Email verification required", 403);
    }

    const payload = buildPayload(user);
    await issueUserSession(req, res, user.id, payload);
    logSecurityEvent("auth.login.success", { userId: user.id });
    res.status(200).json({ authenticated: true });
  } catch (err) {
    const maybeEmail =
      typeof req.body?.email === "string" ? req.body.email : undefined;
    logSecurityEvent("auth.login.failed", { email: maybeEmail, ip: req.ip });
    next(err);
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization?.split(" ")[1];
    const token = authHeader || req.cookies?.[ACCESS_TOKEN_COOKIE];
    if (!token) throw new AppError("Missing access token", 401);

    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const JwtPayloadSchema = z.object({
      id: z.string().uuid(),
      email: z.string().email().nullable(),
      telegram_id: z.string().nullable(),
      role: z.enum(["USER", "ADMIN"]),
      isVerified: z.boolean(),
    });

    const payload = JwtPayloadSchema.parse(decoded);
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError("Access token expired", 401));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid access token", 401));
    }
    next(err);
  }
}

export async function token(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) throw new AppError("Missing refresh token", 401);

    const refreshTokenHash = hashToken(refreshToken);
    const existingSession =
      await authService.findSessionByTokenHash(refreshTokenHash);

    if (!existingSession) {
      clearAuthCookies(res);
      logSecurityEvent("auth.refresh.invalid_token", { ip: req.ip });
      throw new AppError("Invalid refresh token", 401);
    }

    if (existingSession.revokedAt) {
      await authService.revokeSessionFamily(existingSession.familyId);
      clearAuthCookies(res);
      logSecurityEvent("auth.refresh.reuse_detected", {
        userId: existingSession.userId,
        sessionId: existingSession.sessionId,
        familyId: existingSession.familyId,
      });
      throw new AppError("Refresh token reuse detected", 401);
    }

    if (existingSession.expiresAt < new Date()) {
      await authService.revokeSession(existingSession.sessionId);
      clearAuthCookies(res);
      throw new AppError("Refresh token expired", 401);
    }

    const user = await userService.getUser(existingSession.userId);
    if (!user) {
      await authService.revokeSessionFamily(existingSession.familyId);
      clearAuthCookies(res);
      throw new AppError("User not found", 401);
    }

    const payload = buildPayload(user);

    const accessToken = generateAccessToken(payload);
    const nextRefreshToken = generateSecureToken();
    const nextRefreshTokenHash = hashToken(nextRefreshToken);
    const nextRefreshTokenExpirationDate = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    try {
      await authService.rotateSession(existingSession.sessionId, {
        tokenHash: nextRefreshTokenHash,
        familyId: existingSession.familyId,
        parentSessionId: existingSession.sessionId,
        expiresAt: nextRefreshTokenExpirationDate,
        userAgent: req.headers["user-agent"]?.slice(0, 512) || null,
        ip:
          extractClientIp(
            req.headers["x-forwarded-for"] as string | undefined,
          ) ||
          req.ip ||
          null,
        lastUsedAt: new Date(),
        userId: existingSession.userId,
      });
    } catch (rotationError) {
      await authService.revokeSessionFamily(existingSession.familyId);
      clearAuthCookies(res);
      logSecurityEvent("auth.refresh.reuse_detected", {
        userId: existingSession.userId,
        sessionId: existingSession.sessionId,
        familyId: existingSession.familyId,
        source: "rotation",
      });
      throw rotationError;
    }

    setAuthCookies(
      res,
      accessToken,
      nextRefreshToken,
      nextRefreshTokenExpirationDate,
    );
    logSecurityEvent("auth.refresh.rotated", {
      userId: existingSession.userId,
      familyId: existingSession.familyId,
      parentSessionId: existingSession.sessionId,
    });
    res.status(200).json({ authenticated: true });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
      const refreshTokenHash = hashToken(refreshToken);
      const session = await authService.logoutByTokenHash(refreshTokenHash);
      if (session) {
        logSecurityEvent("auth.logout.success", {
          userId: session.userId,
          sessionId: session.sessionId,
        });
      }
    }

    clearAuthCookies(res);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    await authService.revokeAllUserSessions(userId);
    clearAuthCookies(res);
    logSecurityEvent("auth.logout_all.success", { userId });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export async function googleExchange(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = z
      .object({
        idToken: z.string().min(10),
      })
      .safeParse(req.body);
    if (!parsed.success)
      throw new AppError("Invalid Google exchange payload", 400);

    const verifiedGoogleData = await verifyGoogleToken(parsed.data.idToken);
    const user = await authService.loginWithGoogle({
      googleSub: verifiedGoogleData.sub,
      email: verifiedGoogleData.email,
      name: verifiedGoogleData.name || verifiedGoogleData.email,
      photoUrl: verifiedGoogleData.picture ?? null,
    });

    if (!user) throw new AppError("Unable to complete Google login", 401);
    const payload = buildPayload(user);
    await issueUserSession(req, res, user.id, payload);
    logSecurityEvent("auth.google.exchange.success", { userId: user.id });
    res.status(200).json({ authenticated: true });
  } catch (err) {
    logSecurityEvent("auth.google.exchange.failed", { ip: req.ip });
    next(err);
  }
}
