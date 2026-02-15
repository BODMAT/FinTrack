import {
  type LoginUserBody,
  LoginUserResponseSchema,
  type TokenUserBody,
  TokenUserResponseSchema,
  type TokenUserResponse,
  type LoginUserResponse,
} from "@fintrack/types";
import { handleRequest } from "../utils/api";
import api from "./api";

export const loginUser = async (
  payload: LoginUserBody,
): Promise<LoginUserResponse> => {
  return handleRequest(
    api.post("/auth/login", payload),
    LoginUserResponseSchema,
  );
};

export const tokenUser = async (
  payload: TokenUserBody,
): Promise<TokenUserResponse> => {
  return handleRequest(
    api.post("/auth/token", payload),
    TokenUserResponseSchema,
  );
};

export const logoutUser = async (payload: TokenUserBody): Promise<void> => {
  return handleRequest(api.delete("/auth/logout", { data: payload }));
};
