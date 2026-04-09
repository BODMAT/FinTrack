import { useMutation, useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { signOut } from "next-auth/react";
import {
  createUser,
  deleteMe,
  deleteMyAuthMethod,
  getMe,
  updateMe,
} from "@/api/user";
import { loginUser, logoutAllUser, logoutUser } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import type {
  CreateUserBody,
  LoginUserBody,
  LoginUserResponse,
  UserResponse,
} from "@fintrack/types";
import type { ApiError } from "@/types/api";
import { queryClient } from "@/api/queryClient";

export const useAuth = () => {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const {
    isAuthenticated,
    setAuthenticated,
    setBootstrapping,
    isBootstrapping,
    logout: clearStore,
  } = useAuthStore();

  const profile = useQuery<UserResponse, ApiError>({
    queryKey: ["user", "me"],
    queryFn: getMe,
    enabled: isHydrated && isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const register = useMutation<UserResponse, ApiError, CreateUserBody>({
    mutationFn: createUser,
  });

  const login = useMutation<LoginUserResponse, ApiError, LoginUserBody>({
    mutationFn: loginUser,
    onSuccess: async () => {
      setAuthenticated(true);
      setBootstrapping(false);
      await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });

  const logout = useMutation<void, ApiError, void>({
    mutationFn: logoutUser,
    onSettled: () => {
      void signOut({ redirect: false });
      clearStore();
      queryClient.clear();
    },
  });

  const logoutAll = useMutation<void, ApiError, void>({
    mutationFn: logoutAllUser,
    onSettled: () => {
      void signOut({ redirect: false });
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
      void signOut({ redirect: false });
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
    isLoading: !isHydrated || isBootstrapping || profile.isLoading,
    isError: profile.isError,
    profileError: profile.error?.message,
    actions: {
      register: register.mutateAsync,
      login: login.mutateAsync,
      logout: logout.mutateAsync,
      logoutAll: logoutAll.mutateAsync,
      update: update.mutate,
      deleteAccount: deleteAccount.mutate,
      deleteAuthMethod: deleteAuthMethod.mutate,
    },
    status: {
      isLoggingIn: login.isPending,
      isUpdating: update.isPending,
      isRegistering: register.isPending,
      isLoggingOutAll: logoutAll.isPending,
      isDeletingAccount: deleteAccount.isPending,
      isDeletingAuthMethod: deleteAuthMethod.isPending,
      loginError: login.error?.message,
      registerError: register.error?.message,
      logoutAllError: logoutAll.error?.message,
      updateError: update.error?.message,
      deleteAccountError: deleteAccount.error?.message,
      deleteAuthMethodError: deleteAuthMethod.error?.message,
    },
  };
};
