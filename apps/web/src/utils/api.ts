import type { AxiosResponse } from "axios";
import type { ApiError } from "../types/custom";
import type z from "zod";
import axios from "axios";

function isApiError(error: unknown): error is ApiError {
	return (
		typeof error === "object" &&
		error !== null &&
		"error" in error &&
		"message" in error &&
		"code" in error
	);
}

export async function handleRequest<T>(
	request: Promise<AxiosResponse<unknown>>,
	schema?: z.ZodSchema<T>,
): Promise<T> {
	try {
		const response = await request;

		if (schema) {
			const parsed = schema.safeParse(response.data);
			if (!parsed.success) {
				console.error("Zod Validation Error:", parsed.error);
				const validationError: ApiError = {
					error: "Response structure mismatch",
					message: "Data structure error from server",
					code: 500,
				};
				throw validationError;
			}
			return parsed.data;
		}
		return response.data as T;
	} catch (err: unknown) {
		if (isApiError(err)) {
			throw err;
		}

		if (axios.isAxiosError(err)) {
			const serverData = err.response?.data as ApiError | undefined;
			const status = err.response?.status;

			const errorObject: ApiError = {
				message: serverData?.message || "An unexpected error occurred",
				error: serverData?.error || err.message || "Unknown error",
				code: status || 500,
			};

			if (status === 409) {
				errorObject.message =
					"A user with these credentials already exists";
			} else if (status === 401) {
				errorObject.message = "Invalid email or password";
			} else if (status === 400) {
				errorObject.message =
					serverData?.error ||
					serverData?.message ||
					"Invalid request data";
			} else if (!err.response) {
				errorObject.message =
					"Server is unreachable. Please check your connection";
				errorObject.code = 0;
			}

			throw errorObject;
		}

		const unexpectedError: ApiError = {
			message: "An unexpected error occurred",
			error: err instanceof Error ? err.message : "Unknown error",
			code: 500,
		};
		throw unexpectedError;
	}
}
