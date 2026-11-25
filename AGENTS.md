# AGENTS.md

TanStack Start (React) を Cloudflare Workers で動かす、個人開発用テンプレート。
このファイルが AI エージェント向け指示の正本。`CLAUDE.md` はこれを読み込むだけにする。

## コマンド

パッケージ管理は pnpm。npm や yarn は使わない。

| コマンド            | 内容                                                          |
| ------------------- | ------------------------------------------------------------- |
| `pnpm install`      | 依存の導入                                                    |
| `pnpm dev`          | 開発サーバー                                                  |
| `pnpm build`        | 本番ビルド                                                    |
| `pnpm preview`      | ビルド結果を Workers ランタイムで確認                         |
| `pnpm typecheck`    | TypeScript 7 で型チェック                                     |
| `pnpm lint`         | oxlint と ESLint                                              |
| `pnpm format`       | oxfmt で整形                                                  |
| `pnpm format:check` | 整形の検査                                                    |
| `pnpm test`         | Vitest                                                        |
| `pnpm check`        | format:check、lint、typecheck、test をまとめて実行            |
| `pnpm cf-typegen`   | `wrangler.jsonc` から型を生成                                 |
| `pnpm run deploy`   | ビルドして Cloudflare へデプロイ (明示的な指示があるときだけ) |

## 作業完了の条件

`pnpm check` と `pnpm build` が成功すること。画面に影響する変更は、ブラウザでの表示も確認する。
ルートを追加、削除、改名したときは、先に `pnpm build` を実行する (`src/routeTree.gen.ts` が古いと型エラーになる)。

## ディレクトリ構成

- `src/routes/`: ファイルベースのルート
- `src/server/`: サーバー関数 (`createServerFn`)
- `src/lib/`: フレームワークに依存しないロジック。テストは隣に `*.test.ts` で置く
- `src/router.tsx`: ルーターの生成
- `wrangler.jsonc`: Workers の設定

## Cloudflare Workers の制約

- 実行環境は Node.js ではない。`nodejs_compat` を有効にしているが、すべての Node API が使えるわけではない。ファイルシステムや子プロセスに頼らない。
- 環境変数とバインディングは `import { env } from "cloudflare:workers"` で読む。`process.env` を前提にしない。サーバー側のコードだけで使う。
- 秘密の値は `wrangler.jsonc` の `vars` に書かない。手元では `.dev.vars` (コミットしない)、本番では `wrangler secret put` を使う。

## TypeScript が 2 版入っている理由

| `package.json` の名前 | 中身                             | 使う側                     |
| --------------------- | -------------------------------- | -------------------------- |
| `@typescript/native`  | TypeScript 7                     | `tsc` (型チェック)         |
| `typescript`          | `@typescript/typescript6` (TS 6) | ESLint (typescript-eslint) |

typescript-eslint が TS 7.0 を読み込めないための措置。この 2 行を「整理」して 1 つにしない。
typescript-eslint が TS 7 系に対応したら、別名をやめて `typescript` を 7 系だけにする。
`pnpm peers check` が `@typescript/native` の 7.1 以上を求める警告を出すのは、現時点では想定内。

## Lint の分担

- oxlint が主担当で、型情報を使うルールも実行する (`.oxlintrc.json`)。
- ESLint は oxlint にないルールだけを担当する (`eslint.config.js`)。ルールを足すときは、先に oxlint にないか確認する。
- 除外パスは `.oxlintrc.json`、`eslint.config.js`、`.oxfmtrc.json` の 3 か所にある。

## コーディング規約

- TypeScript の `strict` を保つ。`any` と `@ts-ignore` で型エラーを消さない。
- 整形は oxfmt に任せる。
- ロジックを足すときは、先に失敗するテストを書く。
- テストは Node 上の Vitest で動く。`cloudflare:workers` を読み込むコードは直接テストできないので、ロジックは `src/lib/` に分ける。

## 生成ファイル

手で編集しない。コミット対象。

- `src/routeTree.gen.ts`: ルートから生成される。ルートを足したら `pnpm dev` か `pnpm build` で更新する。
- `worker-configuration.d.ts`: `wrangler.jsonc` を変えたら `pnpm cf-typegen` を実行する。
