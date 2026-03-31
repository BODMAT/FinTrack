import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getMe,
  updateMe,
  deleteMe,
  deleteMyAuthMethod,
  createUser,
} from "@/api/user";
import { loginUser, logoutUser } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import type {
  CreateUserBody,
  UserResponse,
  LoginUserBody,
  LoginUserResponse,
} from "@fintrack/types";
import type { ApiError } from "@/types/api";
import { queryClient } from "@/api/queryClient";

const AUTH_COOKIE_NAME = "fintrack_auth";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function setAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export const useAuth = () => {
  const isClient = typeof window !== "undefined";
  const { token, refreshToken, setTokens, logout: clearStore } = useAuthStore();

  const profile = useQuery<UserResponse, ApiError>({
    queryKey: ["user", "me"],
    queryFn: getMe,
    enabled: isClient && !!token,
    retry: false,
  });

  const register = useMutation<UserResponse, ApiError, CreateUserBody>({
    mutationFn: createUser,
  });

  const login = useMutation<LoginUserResponse, ApiError, LoginUserBody>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setAuthCookie();
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });

  const logout = useMutation<void, ApiError, void>({
    mutationFn: () => {
      if (!refreshToken) return Promise.reject(new Error("No refresh token"));
      return logoutUser({ token: refreshToken });
    },
    onSettled: () => {
      clearAuthCookie();
      clearStore();
      queryClient.clear();
    },
  });

  const update = useMutation<UserResponse, ApiError, CreateUserBody>({
    mutationFn: updateMe,
    onSuccess: (data) => {
      queryClient.setQueryData(["user", "me"], data);
    },
  });

  const deleteAccount = useMutation<void, ApiError>({
    mutationFn: deleteMe,
    onSettled: () => {
      clearAuthCookie();
      clearStore();
      queryClient.clear();
    },
  });

  const deleteAuthMethod = useMutation<void, ApiError, string>({
    mutationFn: deleteMyAuthMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });

  return {
    user: profile.data,

    isLoading: !isClient || profile.isLoading,
    isError: profile.isError,
    profileError: profile.error?.message,

    actions: {
      register: register.mutateAsync,
      login: login.mutateAsync,
      logout: logout.mutate,
      update: update.mutate,
      deleteAccount: deleteAccount.mutate,
      deleteAuthMethod: deleteAuthMethod.mutate,
    },
    status: {
      isLoggingIn: login.isPending,
      isUpdating: update.isPending,
      isRegistering: register.isPending,
      isDeletingAccount: deleteAccount.isPending,
      isDeletingAuthMethod: deleteAuthMethod.isPending,

      loginError: login.error?.message,
      registerError: register.error?.message,
      updateError: update.error?.message,
      deleteAccountError: deleteAccount.error?.message,
      deleteAuthMethodError: deleteAuthMethod.error?.message,
    },
  };
};


