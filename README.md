# my-frontend-template

TanStack Start + Cloudflare Workers + TypeScript 7 の、個人開発用テンプレート。

## 必要なもの

- Node.js 22.12 以上
- pnpm (版は `package.json` の `packageManager`)

## 始め方

1. このリポジトリをテンプレートにして、新しいリポジトリを作る。
2. 依存を入れて起動する。

```sh
pnpm install
pnpm dev
```

## 新しいアプリで書き換える箇所

- `package.json` の `name`
- `wrangler.jsonc` の `name` と `vars` (変えたら `pnpm cf-typegen`)
- `src/routes/__root.tsx` の `title`
- この README と `AGENTS.md` の冒頭
- `docs/superpowers/` (テンプレート作りの記録) は削除する

## 検査

```sh
pnpm check
pnpm build
```

## デプロイ

CI は未整備なので、手元からデプロイする。

```sh
pnpm exec wrangler login   # 初回のみ
pnpm run deploy
```

秘密の値は `pnpm exec wrangler secret put <名前>` で登録する。

## AI エージェント

指示は [AGENTS.md](AGENTS.md) にまとめている。
