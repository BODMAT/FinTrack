import express from "express";
import { authenticateToken } from "../auth/controller.js";
import { getAllTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } from "./controller.js";

export const transactionRouter = express.Router();

transactionRouter.get("/", authenticateToken, getAllTransactions);
transactionRouter.get("/:id", authenticateToken, getTransaction);
transactionRouter.post("/", authenticateToken, createTransaction);
transactionRouter.patch("/:id", authenticateToken, updateTransaction);
transactionRouter.delete("/:id", authenticateToken, deleteTransaction);