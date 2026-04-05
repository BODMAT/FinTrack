import { Router } from "express";
import { authenticateToken } from "../auth/controller.js";
import { requireVerifiedUser } from "../../middleware/authz.js";
import {
  getApiKeys,
  upsertApiKey,
  deleteApiKey,
  toggleApiKey,
} from "./controller.js";

export const userApiKeyRouter = Router();

userApiKeyRouter.get("/", authenticateToken, requireVerifiedUser, getApiKeys);
userApiKeyRouter.put("/", authenticateToken, requireVerifiedUser, upsertApiKey);
userApiKeyRouter.delete(
  "/:provider",
  authenticateToken,
  requireVerifiedUser,
  deleteApiKey,
);
userApiKeyRouter.patch(
  "/:provider/toggle",
  authenticateToken,
  requireVerifiedUser,
  toggleApiKey,
);
