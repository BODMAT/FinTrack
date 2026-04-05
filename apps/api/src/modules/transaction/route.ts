import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { requireVerifiedUser } from "../../middleware/authz.js";
import {
  getAllTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "./controller.js";

export const transactionRouter = express.Router();

transactionRouter.get(
  "/",
  authenticateToken,
  requireVerifiedUser,
  getAllTransactions,
);
transactionRouter.get(
  "/:id",
  authenticateToken,
  requireVerifiedUser,
  getTransaction,
);
transactionRouter.post(
  "/",
  authenticateToken,
  requireVerifiedUser,
  createTransaction,
);
transactionRouter.patch(
  "/:id",
  authenticateToken,
  requireVerifiedUser,
  updateTransaction,
);
transactionRouter.delete(
  "/:id",
  authenticateToken,
  requireVerifiedUser,
  deleteTransaction,
);
