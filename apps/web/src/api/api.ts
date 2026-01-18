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

export default api;
