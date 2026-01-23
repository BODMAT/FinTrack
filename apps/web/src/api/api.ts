import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const api = axios.create({
	baseURL:
		import.meta.env.VITE_API_URL ||
		"https://fintrack-irxy.onrender.com/api",
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use(
	(config) => {
		const token = useAuthStore.getState().token;

		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			useAuthStore.getState().logout();
		}
		return Promise.reject(error);
	},
);

export default api;
