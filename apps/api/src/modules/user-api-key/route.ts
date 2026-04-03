import { Router } from "express";
import { authenticateToken } from "../auth/controller.js";
import {
  getApiKeys,
  upsertApiKey,
  deleteApiKey,
  toggleApiKey,
} from "./controller.js";

export const userApiKeyRouter = Router();

userApiKeyRouter.get("/", authenticateToken, getApiKeys);
userApiKeyRouter.put("/", authenticateToken, upsertApiKey);
userApiKeyRouter.delete("/:provider", authenticateToken, deleteApiKey);
userApiKeyRouter.patch("/:provider/toggle", authenticateToken, toggleApiKey);
