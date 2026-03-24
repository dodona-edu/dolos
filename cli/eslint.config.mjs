import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import parentConfig from "../eslint.config.mjs";

export default defineConfig(
  ...parentConfig,
  tseslint.configs.recommended
);