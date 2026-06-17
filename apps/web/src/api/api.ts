import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let csrfTokenCache: string | null = null;

async function fetchCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache;
  const { data } = await axios.get<{ csrfToken: string }>(
    `${process.env.NEXT_PUBLIC_API_URL}/csrf-token`,
    { withCredentials: true },
  );
  csrfTokenCache = data.csrfToken;
  return csrfTokenCache;
}

const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

api.interceptors.request.use(async (config) => {
  if (config.method && MUTATION_METHODS.has(config.method.toLowerCase())) {
    config.headers["x-csrf-token"] = await fetchCsrfToken();
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url ?? "");
    const isAuthEndpoint =
      requestUrl.includes("/auth/token") ||
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/google/exchange") ||
      requestUrl.includes("/auth/telegram/exchange");

    if (error.response?.status === 403 && !originalRequest?._csrfRetry) {
      const isCsrfInvalid =
        error.response?.data?.code === "CSRF_INVALID" ||
        error.response?.data?.details?.code === "CSRF_INVALID";
      if (!isCsrfInvalid) {
        return Promise.reject(error);
      }
      csrfTokenCache = null;
      originalRequest._csrfRetry = true;
      return api(originalRequest);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint &&
      useAuthStore.getState().isAuthenticated
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${api.defaults.baseURL}/auth/token`,
          {},
          {
            withCredentials: true,
          },
        );

        csrfTokenCache = null;
        useAuthStore.getState().setAuthenticated(true);
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
