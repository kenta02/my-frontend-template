# テンプレート土台 設計書

作成日: 2026-11-26

## 目的

個人開発で新しいアプリを始めるときの出発点になるリポジトリを作り、育てていく。

- TanStack Start で作り、Cloudflare Workers で動く。
- 言語は TypeScript 7。
- Claude Code、Codex など複数の AI エージェントが、同じ前提で作業できる。

## 範囲

### 今回作るもの(土台)

- TanStack Start のアプリ。Workers 上で開発、ビルド、デプロイできる。
- TypeScript 7 による型チェック。
- oxlint と ESLint による Lint、oxfmt によるフォーマット。
- Vitest によるテスト。
- GitHub Actions による検査とデプロイ。
- `AGENTS.md`、`CLAUDE.md`、`README.md`。

### 今回作らないもの

- DB、認証、UI ライブラリ。土台の完成後に、1 つずつ独立したレシピとして設計する。認証の回は、仕組みの説明から始める。
- `.claude/` などエージェントごとの固有設定。必要になった時点で足す。
- モノレポ構成、独自の雛形生成 CLI。

### 避けたい状態

- `AGENTS.md` と `CLAUDE.md` に同じ内容が重複し、食い違う。
- 使わない機能が最初から入っていて、新規アプリのたびに削除作業が必要になる。

## 制約

- 実行環境は Cloudflare Workers。Node 専用 API を前提にしない。
- typescript-eslint (8.74.0 時点) の対応範囲は `typescript <6.1.0` で、TS 7 を読み込めない。
- `@tanstack/react-start` は Node 22.12 以上、Vite を使う場合は Vite 8 以上が必要。

## Lint 構成の検討

| 案 | 内容 | 良い点 | 代償 |
|----|------|--------|------|
| A | oxlint を主役にし、ESLint を併用する。ESLint 用に TS 6 を並べる | 希望の ESLint + oxlint 構成になる。ESLint プラグインがそのまま使える | TS が 2 版並ぶ。ESLint だけ TS 6 の解釈になる |
| B | oxlint のみ。ESLint は対応後に足す | TS は 7 だけで単純 | 一部の ESLint プラグインが使えないか、検証が必要 |
| C | プロジェクト全体を TS 6 にする | 周辺ツールが全部そのまま動く | TS 7 を使うという要件に反する |

**A を採用(持ち主が選択)。** C は要件に反するため除外した。

## 設計

### TypeScript の二重導入

`package.json` の devDependencies は、TypeScript 公式が案内する別名の形にする。

```json
{
  "typescript": "npm:@typescript/typescript6@^6.0.2",
  "@typescript/native": "npm:typescript@^7.0.2"
}
```

- `tsc` は TS 7。型チェックは `tsc --noEmit` で行う。
- `import "typescript"` は TS 6 の API を返し、typescript-eslint だけが使う。
- 導入後に `tsc --version` が 7 系であることを確認する。
- typescript-eslint が TS 7 系に対応したら、この別名をやめて TS 7 だけにする。

### Lint と Format

- **oxlint**: 主な Lint 担当。`oxlint-tsgolint` を入れ、型情報を使うチェックを有効にする。
- **ESLint**: oxlint にないルールだけを担当する。初期状態では `@tanstack/eslint-plugin-router`。`eslint-plugin-oxlint` で重複ルールを無効にする。
- **oxfmt**: フォーマット担当。1.0 前の版なので、問題が出たら Prettier に替える。
- `lint` コマンド 1 つで oxlint と ESLint の両方が走る。

### アプリの中身

見本は最小限にする。

- トップページ 1 枚。
- サーバー関数 1 つ。`cloudflare:workers` の `env` から値を読み、画面に表示する。Workers の仕組みがつながっていることの確認を兼ねる。
- テスト 1 本。

構成は、Cloudflare の公式手順 (`@cloudflare/vite-plugin` と `wrangler.jsonc`) に従う。

### コマンド

pnpm を使う。

| コマンド | 内容 |
|----------|------|
| `pnpm dev` | 開発サーバー |
| `pnpm build` | 本番ビルド |
| `pnpm typecheck` | TS 7 で型チェック |
| `pnpm lint` | oxlint と ESLint |
| `pnpm format` / `pnpm format:check` | oxfmt |
| `pnpm test` | Vitest |
| `pnpm check` | format:check、lint、typecheck、test をまとめて実行 |
| `pnpm run deploy` | ビルドして `wrangler deploy` |

### CI/CD (今回は後回し。2026-11-26 の持ち主の指示)

- プルリクエストと `main` への push で、`check` と `build` を実行する。
- `main` への push では、成功後にデプロイする。`CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` が未設定のリポジトリでは、デプロイを飛ばして成功扱いにする(テンプレートから作った直後に CI が赤くならないようにするため)。

### AI エージェント向けの文書

- `AGENTS.md` を唯一の正本にする。内容は、コマンド一覧、ディレクトリ構成、Workers の制約、TS の二重導入の理由、コーディング規約、作業完了前に `pnpm check` と `pnpm build` を通すこと。
- `CLAUDE.md` は `@AGENTS.md` の 1 行だけにする。
- `README.md` は人向け。テンプレートからの始め方、デプロイに必要な設定、アプリごとに書き換える箇所(名前など)、新規アプリでは `docs/superpowers/`(テンプレート作りの記録)を削除することを書く。

## 完成の条件

1. クリーンな状態で `pnpm install`、`pnpm check`、`pnpm build` が成功する。
2. `pnpm dev` と、ビルド後の Workers ランタイムでのプレビューの両方で、トップページが表示され、サーバー関数の値が出る。
3. `tsc --version` が 7 系を示し、ESLint が起動時エラーを出さない。
4. 意図的な型エラーと Lint 違反を入れると、`pnpm check` が失敗する。

実際の Cloudflare へのデプロイは、持ち主のアカウント設定が必要なので、完成条件に含めない。

## 実装者に任せること

- 各パッケージの具体的な版。
- ルールの細かい設定、`tsconfig` の詳細、ディレクトリ名。
- 雛形コマンドを使うか、手で組むか。

## 持ち主が確認していない判断

提案して指摘がなかったもの、または書き手が決めたもの。

- oxfmt と pnpm の採用。
- GitHub のテンプレートリポジトリとして使う想定。
- 見本の中身、`check` コマンド、デプロイを飛ばす挙動、完成の条件。
