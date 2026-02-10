import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	globalIgnores(["dist", "node_modules", "apps/api/dist/**", "apps/web/**"]),
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
			parserOptions: {
				tsconfigRootDir: process.cwd(),
				project: "./apps/api/tsconfig.json"
			},
		},
		rules: {
			semi: ["error", "always"],
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
		}, },
	// Here you can add separate blocks for web (React) and bot
]);
