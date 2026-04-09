import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { requireVerifiedUser } from "../../middleware/authz.js";
import {
  getAllTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchMonobankAccounts,
  fetchMonobankTransactions,
  importMonobankTransactions,
  deleteMonobankTransactions,
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
  "/monobank/accounts",
  authenticateToken,
  requireVerifiedUser,
  fetchMonobankAccounts,
);
transactionRouter.post(
  "/monobank/fetch",
  authenticateToken,
  requireVerifiedUser,
  fetchMonobankTransactions,
);
transactionRouter.post(
  "/monobank/import",
  authenticateToken,
  requireVerifiedUser,
  importMonobankTransactions,
);
transactionRouter.delete(
  "/monobank",
  authenticateToken,
  requireVerifiedUser,
  deleteMonobankTransactions,
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
