import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	globalIgnores(["dist", "node_modules"]),
	// API (Node.js, TypeScript)
	{
		files: ["apps/api/**/*.ts"],
		ignores: ["*.test.ts", "*.spec.ts"],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			eslintConfigPrettier,
		],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "module",
			globals: {
				...globals.node,
			},
		},
		rules: {
			semi: ["error", "always"],
			"no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
		},
	},
	// Here you can add separate blocks for web (React) and bot
]);
