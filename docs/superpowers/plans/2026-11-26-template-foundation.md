# テンプレート土台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TanStack Start + Cloudflare Workers + TypeScript 7 の、すぐ開発とデプロイを始められるテンプレートを作る。

**Architecture:** リポジトリ直下の単一アプリ。Vite と `@cloudflare/vite-plugin` で Workers 向けに開発、ビルドする。型チェックは TS 7、ESLint だけが別名で入れた TS 6 を使う。

**Tech Stack:** TanStack Start (React), Vite 8+, Wrangler, TypeScript 7, oxlint + oxlint-tsgolint, ESLint, oxfmt, Vitest, pnpm, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-11-26-template-foundation-design.md`

## Global Constraints

- 実行環境は Cloudflare Workers。Node 専用 API を前提にしない。
- Node `>=22.12.0`、Vite `>=8.0.0`。
- devDependencies の別名は次のとおり: `"typescript": "npm:@typescript/typescript6@^6.0.2"`、`"@typescript/native": "npm:typescript@^7.0.2"`。
- パッケージ管理は pnpm。`package.json` の `packageManager` に使った版を書く。
- DB、認証、UI ライブラリ、`.claude/`、モノレポ構成、雛形生成 CLI は入れない。
- 作業ブランチは `feat/template-foundation`。push とプルリクエスト作成は、持ち主の指示があるまで行わない。
- 公開される可能性があるファイルに、持ち主の個人情報を書かない。
- コミットメッセージの末尾: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`
- pnpm が未導入の場合は、グローバルに導入する前に持ち主の了承を得る。
- パッケージ導入が公開直後の版の制限 (Safe-chain) に掛かる場合は、制限を外さず、入る版を使う。

## Review Focus

1. 環境変数 `GREETING` が未設定または空でも、ページは既定の文言を表示する (Task 1 のテスト)。
2. クローン直後、`dev` や `build` を一度も実行せずに `pnpm check` が通る (Task 2 Step 6)。
3. Cloudflare の認証情報が片方だけ設定されている場合も、デプロイは飛ばされる (Task 3)。
4. プルリクエストではデプロイされない (Task 3)。
5. 生成ファイル (`src/routeTree.gen.ts`、`worker-configuration.d.ts`) が Lint とフォーマット検査で失敗を起こさない (Task 2)。

---

### Task 1: Workers で動くアプリの骨組みと型チェック

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `wrangler.jsonc`, `.gitignore`, `.node-version`
- Create: `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/lib/greeting.ts`, `src/server/greeting.ts`
- Generate (コミットする): `src/routeTree.gen.ts`, `worker-configuration.d.ts`
- Test: `src/lib/greeting.test.ts`

**Interfaces:**
- Produces: `resolveGreeting(value: string | undefined): string`、`getGreeting` (サーバー関数、戻り値 `Promise<string>`)
- Produces: scripts `dev`, `build`, `preview`, `typecheck`, `test`, `deploy`, `cf-typegen`

- [ ] **Step 1: プロジェクトを用意する**

依存: `@tanstack/react-start`, `@tanstack/react-router`, `react`, `react-dom` と、dev に `vite`, `@vitejs/plugin-react`, `@cloudflare/vite-plugin`, `wrangler`, `vitest`, `@types/react`, `@types/react-dom`, `@types/node`, 上記 TS の別名 2 つ。

scripts:

```json
{
  "dev": "vite dev",
  "build": "vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "cf-typegen": "wrangler types",
  "deploy": "pnpm run build && wrangler deploy"
}
```

`wrangler.jsonc`: `name` は `my-frontend-template`、`main` は `@tanstack/react-start/server-entry`、`compatibility_flags` は `["nodejs_compat"]`、`compatibility_date` は作業日、`vars` は `{ "GREETING": "Hello from Cloudflare Workers" }`。

`vite.config.ts` のプラグインは `cloudflare({ viteEnvironment: { name: "ssr" } })`、`tanstackStart()`、`viteReact()` の順。導入時点の [Cloudflare の手順](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/) と違えば、公式を優先する。

`tsconfig.json` は `strict: true`、`noEmit: true`。`vitest.config.ts` は `vite.config.ts` を読み込まない独立した設定 (Node 環境、`src/**/*.test.ts`)。

- [ ] **Step 2: 失敗するテストを書く** (`src/lib/greeting.test.ts`)

```ts
it("設定値をそのまま返す", () => {
  expect(resolveGreeting("こんにちは")).toBe("こんにちは");
});
it.each([undefined, "", "   "])("未設定や空 (%j) は既定の文言を返す", (value) => {
  expect(resolveGreeting(value)).toBe("Hello");
});
```

- [ ] **Step 3: 失敗を確認する**

Run: `pnpm test`
Expected: `resolveGreeting` が見つからず FAIL

- [ ] **Step 4: `resolveGreeting` とアプリを実装する**

- `src/server/greeting.ts`: `createServerFn({ method: "GET" })` のハンドラで、`cloudflare:workers` の `env.GREETING` を `resolveGreeting` に渡す。
- `src/routes/index.tsx`: ローダーで `getGreeting()` を呼び、戻り値を `<h1>` に表示する。
- `src/router.tsx`: `getRouter()` を export する。

- [ ] **Step 5: 生成ファイルを作り、検査する**

Run: `pnpm cf-typegen && pnpm build && pnpm typecheck && pnpm test && pnpm exec tsc --version`
Expected: すべて成功し、版は `Version 7.x`

- [ ] **Step 6: 画面を確認する**

`pnpm dev` と、`pnpm build && pnpm preview` の両方で、トップページに `Hello from Cloudflare Workers` が表示されることを、ブラウザで確認する (`browser-automation` スキル)。コンソールエラーがないことも見る。

- [ ] **Step 7: Commit** — `feat: TanStack Start を Cloudflare Workers で動かす`

---

### Task 2: Lint、フォーマット、`check`

**Files:**
- Create: `.oxlintrc.json`, `eslint.config.js`, `.oxfmtrc.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1 の `typecheck`, `test`
- Produces: scripts `lint`, `format`, `format:check`, `check`

- [ ] **Step 1: 導入する**

dev 依存: `oxlint`, `oxlint-tsgolint`, `oxfmt`, `eslint`, `typescript-eslint`, `eslint-plugin-oxlint`, `@tanstack/eslint-plugin-router`。

- [ ] **Step 2: 設定する**

- oxlint: `typescript`, `react`, `import` 系を有効にする。`correctness` は error。`typescript/no-floating-promises` は error。
- ESLint (flat config): `.ts`, `.tsx` を typescript-eslint のパーサーで読み、`@tanstack/router` の推奨ルールを適用し、末尾に `eslint-plugin-oxlint` の設定を置く。型情報を使うルールは有効にしない。
- 3 ツールすべてで `dist`, `.wrangler`, `.output`, `src/routeTree.gen.ts`, `worker-configuration.d.ts` を除外する。`oxfmt` は `docs/superpowers` も除外する。

scripts:

```json
{
  "lint": "oxlint --type-aware --deny-warnings && eslint . --max-warnings 0",
  "format": "oxfmt",
  "format:check": "oxfmt --check",
  "check": "pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test"
}
```

- [ ] **Step 3: 通ることを確認する**

Run: `pnpm format && pnpm check`
Expected: すべて成功。ESLint が TS の版に関する起動時エラーを出さない

- [ ] **Step 4: 違反で失敗することを確認する**

一時ファイル `src/lib/tmp-violation.ts` を 1 種類ずつ作り、それぞれ失敗することを確認して削除する。

| 内容 | 失敗するコマンド |
|------|------------------|
| `export const n: number = "a";` | `pnpm typecheck` |
| `export function f() { Promise.resolve(1); }` | `pnpm lint` |
| `export const   a=1` | `pnpm format:check` |

- [ ] **Step 5: Commit** — `chore: oxlint、ESLint、oxfmt を追加する`

- [ ] **Step 6: クリーンな状態を確認する**

Run: `git clone . <scratchpad>/clean && cd <scratchpad>/clean && pnpm install --frozen-lockfile && pnpm check && pnpm build`
Expected: すべて成功。失敗したら直して追加コミットする

---

### Task 3: CI とデプロイ (今回は実施しない。持ち主の指示で後回し)

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `check`, `build`, `deploy`

- [ ] **Step 1: ワークフローを書く**

- トリガー: `pull_request` と、`main` への `push`。`permissions: contents: read`。
- ジョブ `check`: checkout、pnpm の導入、`.node-version` の Node (pnpm キャッシュ)、`pnpm install --frozen-lockfile`、`pnpm check`、`pnpm build`。
- ジョブ `deploy`: `needs: check`、`if: github.event_name == 'push' && github.ref == 'refs/heads/main'`、同時実行は 1 つ。`secrets` は `if` で直接参照できないため、次の形で判定し、以降の各ステップに `if: steps.creds.outputs.ready == 'true'` を付ける。

```yaml
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
steps:
  - id: creds
    run: |
      if [ -n "$CLOUDFLARE_API_TOKEN" ] && [ -n "$CLOUDFLARE_ACCOUNT_ID" ]; then
        echo "ready=true" >> "$GITHUB_OUTPUT"
      else
        echo "ready=false" >> "$GITHUB_OUTPUT"
        echo "::notice::Cloudflare の認証情報が未設定のため、デプロイを飛ばします"
      fi
```

- [ ] **Step 2: 検証する**

Run: `pnpm dlx @action-validator/cli .github/workflows/ci.yml` (使えない場合は `actionlint`)
Expected: エラーなし。あわせて判定スクリプトを、両方あり、片方のみ、両方なしの 3 通りで手元で実行し、順に `true`, `false`, `false` になることを確認する。

GitHub 上での実行は push しないと確認できないため、未確認として報告する。

- [ ] **Step 3: Commit** — `ci: 検査と Cloudflare へのデプロイを追加する`

---

### Task 4: 文書

**Files:**
- Create: `AGENTS.md`, `CLAUDE.md`, `README.md`

- [ ] **Step 1: `AGENTS.md` を書く**

見出し: コマンド、ディレクトリ構成、Cloudflare Workers の制約、TypeScript の二重導入 (理由と、外す条件)、コーディング規約、生成ファイル (手で編集しない。`wrangler.jsonc` を変えたら `pnpm cf-typegen`)、作業完了の条件 (`pnpm check` と `pnpm build`)。実際のファイルと `package.json` に一致させる。

- [ ] **Step 2: `CLAUDE.md` を書く** — 内容は次の 1 行だけ。

```
@AGENTS.md
```

- [ ] **Step 3: `README.md` を書く**

テンプレートからの始め方、必要な Node と pnpm、書き換える箇所 (`package.json` と `wrangler.jsonc` の `name`、`vars`)、手動デプロイの方法 (`pnpm run deploy`。CI は未整備)、新規アプリでは `docs/superpowers/` を削除すること。

- [ ] **Step 4: 確認する**

Run: `pnpm check && pnpm build`
Expected: 成功。文書に書いたコマンドがすべて `package.json` に存在する

- [ ] **Step 5: Commit** — `docs: AGENTS.md と README を追加する`
