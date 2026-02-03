import { handleRequest } from "../utils/api";
import {
	UserResponseSchema,
	type CreateUserBody,
	type UserResponse,
} from "@fintrack/types";
import api from "./api";

export const getMe = async (): Promise<UserResponse> => {
	return handleRequest(api.get("/users/me"), UserResponseSchema);
};

export const createUser = async (
	payload: CreateUserBody,
): Promise<UserResponse> => {
	return handleRequest(api.post("/users/", payload), UserResponseSchema);
};

export const updateMe = async (
	payload: CreateUserBody,
): Promise<UserResponse> => {
	return handleRequest(api.patch("/users/me", payload), UserResponseSchema);
};

export const deleteMe = async (): Promise<void> => {
	return handleRequest(api.delete("/users/me"));
};

export const deleteMyAuthMethod = async (
	authMethodId: string,
): Promise<void> => {
	return handleRequest(api.delete(`/users/me/auth-methods/${authMethodId}`));
};
