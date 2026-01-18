import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getMe,
	updateMe,
	deleteMe,
	deleteMyAuthMethod,
	createUser,
} from "../api/user";
import { loginUser, logoutUser } from "../api/auth";
import { useAuthStore } from "../store/useAuthStore";
import type { CreateUserBody, UserResponse } from "../types/user";
import type { LoginUserBody, LoginUserResponse } from "../types/auth";
import type { ApiError } from "../types/custom";

export const useAuth = () => {
	const queryClient = useQueryClient();
	const {
		token,
		refreshToken,
		setTokens,
		logout: clearStore,
	} = useAuthStore();

	const profile = useQuery<UserResponse, ApiError>({
		queryKey: ["user", "me"],
		queryFn: getMe,
		enabled: !!token,
		retry: false,
	});

	const register = useMutation<UserResponse, ApiError, CreateUserBody>({
		mutationFn: createUser,
	});

	const login = useMutation<LoginUserResponse, ApiError, LoginUserBody>({
		mutationFn: loginUser,
		onSuccess: (data) => {
			setTokens(data.accessToken, data.refreshToken);
			queryClient.invalidateQueries({ queryKey: ["user", "me"] });
		},
	});

	const logout = useMutation<void, ApiError, void>({
		mutationFn: () => {
			if (!refreshToken)
				return Promise.reject(new Error("No refresh token"));
			return logoutUser({ token: refreshToken });
		},
		onSettled: () => {
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

		isLoading: profile.isLoading,
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
