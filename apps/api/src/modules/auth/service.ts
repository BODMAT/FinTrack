import bcrypt from "bcrypt";
import { prisma } from "../../prisma/client.js";
import * as userService from "../user/service.js";
import { AppError } from "../../middleware/errorHandler.js";

export async function login(email: string, password: string) {
  const authMethod = await prisma.authMethod.findUnique({
    where: {
      email,
    },
  });

  if (!authMethod) throw new AppError("Not found", 404);

  if (await bcrypt.compare(password, authMethod?.password_hash ?? "")) {
    return await userService.getUser(authMethod.userId);
  }

  throw new AppError("Password is incorrect", 400);
}

export async function addRefreshToken(
  refreshToken: string,
  refreshTokenExpirationDate: Date,
  userId: string,
) {
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      expiresAt: refreshTokenExpirationDate,
      userId,
    },
  });
}

export async function refreshTokenExists(refreshToken: string) {
  return await prisma.refreshToken.findUnique({
    where: {
      token: refreshToken,
    },
  });
}

export async function logout(refreshToken: string) {
  return await prisma.refreshToken.delete({
    where: {
      token: refreshToken,
    },
  });
}
