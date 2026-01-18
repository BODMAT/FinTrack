import { ENV } from "../../config/env.js";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../../types/jwt.js";
import { AppError } from "../../middleware/errorHandler.js";
import * as authService from "./service.js";

// Controllers
const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } = ENV;

export function generateAccessToken(payload: JwtPayload): string {
	return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "30m" });
}

export async function login(req: Request, res: Response, next: NextFunction) {
	try {
		const LoginSchema = z.object({
			email: z.email(),
			password: z.string().min(8),
		});
		const { email, password } = LoginSchema.parse(req.body);

		const user = await authService.login(email, password);
		if (!user) throw new AppError("Not found", 404);

		const payload: JwtPayload = {
			id: user.id,
			email:
				user.authMethods.find((m) => m.type === "EMAIL")?.email ?? null,
			telegram_id:
				user.authMethods.find((m) => m.type === "TELEGRAM")
					?.telegram_id ?? null,
		};

		const accessToken = generateAccessToken(payload);
		const expiresIn = 7;
		const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
			expiresIn: `${expiresIn}d`,
		});

		const refreshTokenExpirationDate = new Date(
			Date.now() + expiresIn * 24 * 60 * 60 * 1000,
		);
		await authService.addRefreshToken(
			refreshToken,
			refreshTokenExpirationDate,
			user.id,
		);

		res.status(200).json({ refreshToken, accessToken });
	} catch (err) {
		next(err);
	}
}

export function authenticateToken(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader?.split(" ")[1];
		if (!token) throw new AppError("Missing access token", 401);

		jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
			if (err) {
				if (err.name === "TokenExpiredError") {
					return next(new AppError("Access token expired", 401));
				}
				if (err.name === "JsonWebTokenError") {
					return next(new AppError("Invalid access token", 401));
				}
				return next(new AppError("Failed to authenticate token", 401));
			}

			const JwtPayloadSchema = z.object({
				id: z.uuid(),
				email: z.email().nullable(),
				telegram_id: z.string().nullable(),
			});

			const payload = JwtPayloadSchema.parse(decoded);
			req.user = payload;
			next();
		});
	} catch (err) {
		next(err);
	}
}

export async function token(req: Request, res: Response, next: NextFunction) {
	try {
		const refreshToken = req.body.token;
		if (!refreshToken) throw new AppError("Missing refresh token", 401);

		const existingToken =
			await authService.refreshTokenExists(refreshToken);
		if (!existingToken) throw new AppError("Invalid refresh token", 401);

		if (existingToken.expiresAt < new Date()) {
			await authService.logout(refreshToken);
			throw new AppError("Refresh token expired", 401);
		}

		try {
			const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
			const refreshTokenPayloadSchema = z.object({
				id: z.uuid(),
			});
			const refreshTokenPayload =
				refreshTokenPayloadSchema.parse(decoded);

			const accessToken = generateAccessToken({
				id: refreshTokenPayload.id,
				email: null,
				telegram_id: null,
			});

			res.status(200).json({ accessToken });
		} catch (err) {
			throw new AppError("Invalid refresh token signature", 401);
		}
	} catch (err) {
		next(err);
	}
}

export async function logout(req: Request, res: Response, next: NextFunction) {
	try {
		const refreshToken = req.body.token;
		if (!refreshToken) throw new AppError("Missing refresh token", 401);
		const existingToken =
			await authService.refreshTokenExists(refreshToken);
		if (!existingToken)
			throw new AppError("Invalid refresh token signature", 401);

		await authService.logout(refreshToken);
		res.sendStatus(204);
	} catch (err) {
		next(err);
	}
}
