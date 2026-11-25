// ESLint は oxlint にないルールだけを担当する
import pluginRouter from "@tanstack/eslint-plugin-router";
import oxlint from "eslint-plugin-oxlint";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "dist",
    ".wrangler",
    ".output",
    "src/routeTree.gen.ts",
    "worker-configuration.d.ts",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
  },
  pluginRouter.configs["flat/recommended"],
  // 重複ルールの無効化は末尾に置く
  oxlint.buildFromOxlintConfigFile("./.oxlintrc.json"),
);
