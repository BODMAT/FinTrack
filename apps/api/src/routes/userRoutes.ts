import express from "express";
import { getAllUsers, getUser, createUser, updateUser, deleteUser } from "../controllers/userController.js";

export const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUser);
userRouter.post("/", createUser);
userRouter.patch("/:id", updateUser);
userRouter.delete("/:id", deleteUser);
