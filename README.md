# AIチャットボット

Claude API(Claude Haiku 4.5)を利用した、Webサイト埋め込み向けの汎用チャットボットです。
詳細な仕様は [`CLAUDE.md`](./CLAUDE.md)、実装計画は [`TODO.md`](./TODO.md) を参照してください。

## ディレクトリ構成

```
.
├── CLAUDE.md   # 仕様書
├── TODO.md     # 実行計画(TODOリスト)
├── server/     # バックエンド(Node.js / Express / Anthropic API)
└── client/     # フロントエンド(React)
```

## セットアップ

`Makefile` に主要な操作をまとめています(`make` コマンドが必要です)。

```sh
make init    # server/client の依存パッケージをインストール
make dev     # 開発サーバーを起動(バックエンド:3001 / フロントエンド:5173)
make build   # フロントエンドを本番用にビルド
make deploy  # ビルド後、ローカル環境で本番相当のプレビューを起動(デプロイ先はローカルのみ)
make clean   # node_modules とビルド成果物を削除
```

`make init` の後、`server/.env` を開いて `ANTHROPIC_API_KEY` にご自身のAnthropic APIキーを
設定してください(`server/.env.example` を参照)。`.env` を変更した場合は `make dev` を
起動し直す必要があります。

`make` コマンドが使えない環境では、`server/` と `client/` それぞれで直接
`npm install` / `npm run dev` などを実行しても同様に動作します。

## 開発状況

進捗は [`TODO.md`](./TODO.md) のチェックリストで管理しています。
