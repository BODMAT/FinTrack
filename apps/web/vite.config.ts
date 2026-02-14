import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
	base: "/FinTrack/",
	plugins: [tailwindcss(), react(), svgr()],
});
