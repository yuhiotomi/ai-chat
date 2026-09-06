SERVER_DIR := server
CLIENT_DIR := client

.DEFAULT_GOAL := help

.PHONY: help
help:
	@echo "利用可能なコマンド:"
	@echo "  make init    - server/client の依存パッケージをインストールする"
	@echo "  make dev     - 開発サーバーを起動する(バックエンド:3001 / フロントエンド:5173)"
	@echo "  make build   - フロントエンドを本番用にビルドする"
	@echo "  make deploy  - ビルド後、ローカル環境で本番相当のプレビューを起動する"
	@echo "  make clean   - node_modules とビルド成果物を削除する"

# 初期化: server/client それぞれの依存パッケージをインストールする
.PHONY: init
init:
	cd $(SERVER_DIR) && npm install
	cd $(CLIENT_DIR) && npm install
	@echo ""
	@echo "server/.env と client/.env を確認してください(各 .env.example を参照)"
	@echo "特に server/.env の ANTHROPIC_API_KEY の設定が必要です"

# 開発サーバー起動: バックエンド(Express)とフロントエンド(Vite)を同時に起動する
# Ctrl+C で両方のプロセスを終了する
.PHONY: dev
dev:
	@trap 'kill 0' EXIT INT TERM; \
	( cd $(SERVER_DIR) && npm run dev ) & \
	( cd $(CLIENT_DIR) && npm run dev ) & \
	wait

# ビルド: フロントエンドを本番用に静的ファイルへビルドする
# バックエンドはNode.jsスクリプトをそのまま実行するためビルド不要
.PHONY: build
build:
	cd $(CLIENT_DIR) && npm run build

# デプロイ: 現仕様ではデプロイ先はローカル環境のみのため、
# ビルド成果物をローカルで本番相当として起動する処理とする
# Ctrl+C で両方のプロセスを終了する
.PHONY: deploy
deploy: build
	@echo "ローカル環境で本番相当のプレビューを起動します(デプロイ先: ローカルのみ)"
	@trap 'kill 0' EXIT INT TERM; \
	( cd $(SERVER_DIR) && npm start ) & \
	( cd $(CLIENT_DIR) && npm run preview ) & \
	wait

# クリーン: 依存パッケージとビルド成果物を削除する
.PHONY: clean
clean:
	rm -rf $(SERVER_DIR)/node_modules
	rm -rf $(CLIENT_DIR)/node_modules
	rm -rf $(CLIENT_DIR)/dist
