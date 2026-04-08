import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { requireRole } from "../../middleware/authz.js";
import {
  createErrorLog,
  getErrorLogs,
  getStats,
  getUsers,
  markErrorLogResolved,
  revokeSessionsForAllUsers,
  revokeSessionsForUser,
  setUserRole,
} from "./controller.js";

export const adminRouter = express.Router();

// Any authenticated user can report runtime UI/API errors to admin queue.
adminRouter.post("/error-logs/report", authenticateToken, createErrorLog);

adminRouter.patch(
  "/users/:userId/role",
  authenticateToken,
  requireRole(["ADMIN"]),
  setUserRole,
);

adminRouter.get("/users", authenticateToken, requireRole(["ADMIN"]), getUsers);

adminRouter.post(
  "/sessions/revoke-user/:userId",
  authenticateToken,
  requireRole(["ADMIN"]),
  revokeSessionsForUser,
);

adminRouter.post(
  "/sessions/revoke-all",
  authenticateToken,
  requireRole(["ADMIN"]),
  revokeSessionsForAllUsers,
);

adminRouter.get("/stats", authenticateToken, requireRole(["ADMIN"]), getStats);

adminRouter.get(
  "/error-logs",
  authenticateToken,
  requireRole(["ADMIN"]),
  getErrorLogs,
);

adminRouter.patch(
  "/error-logs/:errorLogId/resolve",
  authenticateToken,
  requireRole(["ADMIN"]),
  markErrorLogResolved,
);
