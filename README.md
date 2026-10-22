# 麻雀点数計算ツール

手牌・和了条件・ドラを選ぶと点数（役・翻・符・支払い）を計算する Web ツールです。

🀄 **公開URL: https://fumimi23.github.io/mahjong-score-calculation/**

React + TypeScript + Vite + Tailwind CSS で実装しています。

## 機能

- **手牌入力**: 34 種の牌をクリックで選択。アガリ牌の指定、赤ドラ（5）切り替え。
- **副露（鳴き）**: ポン / チー / 暗槓 / 大明槓 / 加槓。鳴いた面子の赤5にも対応。手牌と並べて1つの手牌として表示。
- **和了条件**: ツモ / ロン、場風 / 自風、立直 / ダブリー・一発・海底・河底・嶺上・槍槓。
- **ドラ**: 表ドラ・裏ドラ（立直時）の表示牌指定、赤ドラ。
- **点数計算**: 面子分解 → 役判定 → 符計算 → 点数算出を通し、複数の分解から最も高い点（高点法）を採用。役・翻・符・支払い内訳を表示。

## 対応範囲・採用ルール

- リーチ麻雀の標準役（1 翻〜役満）と役満を網羅。食い下がり対応。
- 通常手・七対子・国士無双。
- 数え役満（13 翻以上）は役満扱い。
- 切り上げ満貫は不採用（例: 4 翻 30 符 = 7700）。
- 連風牌（自風かつ場風）の雀頭は +2 符（天鳳 / M-League 準拠）。
- 本場・供託の加算は未対応。

## 開発

前提: Node.js（`.node-version` 参照）、Corepack 経由の Yarn。

```sh
corepack enable
yarn            # 依存インストール
yarn dev        # 開発サーバ
yarn build      # 型チェック + 本番ビルド
yarn lint       # ESLint
yarn test       # Vitest
sh scripts/check.sh  # CI 一式（lint → 型チェック → テスト）
sh scripts/fmt.sh    # 整形の適用（ESLint --fix）
```

- **リンター / フォーマッター**: ESLint（整形ルールは @stylistic）。検査は `yarn lint`、整形の適用は `sh scripts/fmt.sh`。
- **CI**: `scripts/check.sh` が単一の入口（ESLint → `tsc -b` → Vitest → `scripts/next-issue.py` のテスト）。push 前フックと、GitHub Actions の `ci.yml`（全ブランチの push）・`deploy.yml`（公開前）が同じものを実行する。
- **デプロイ**: `main` への push で GitHub Pages に自動公開（`.github/workflows/deploy.yml`）。

## ローカル CI

push 前に `scripts/check.sh` を実行し、失敗したら push を止める git フックを同梱している。クローンごとに一度有効化する。

```sh
git config core.hooksPath .githooks
```

緊急時のみ `git push --no-verify` でスキップできる。

## テスト

テストを仕様の正本として扱い、3 層に分ける。

- `tests/spec/` — 約束の台帳。振る舞いレベルで書き、対応 issue 番号をコメントで併記する。ここにある挙動だけが約束で、それ以外は変更してよい偶然の挙動。
- `tests/unit/` — 実装都合のテスト。設計の足場で、自由に変更・削除してよい。
- `tests/invariants/` — 横断不変条件（個別機能ではなく全体を走査して成り立つ性質）。
- `src/**/*.test.ts(x)` の同居テストは 3 層に未分類。既知の点数表との照合など約束相当のものを含む。

## issue 運用

- 1 issue = 1 セッション。着手する issue は `python3 scripts/next-issue.py` で選ぶ（選択規則はこのスクリプトが正本）。
- issue には優先度ラベル `P0` / `P1` / `P2` を必ず 1 つ付ける。着手中は `in-progress` ラベル + アサイン。
- 依存は issue 本文に `Blocked by #N` 行で書く。
- リリース単位はマイルストーン（名前 = タグ名、`v1.0.0` 形式）。open の issue と PR が 0 件になったら `sh scripts/release.sh <タグ>` で Release を切る。

## ディレクトリ構成

```
src/
  domain/        牌・面子・手牌・和了条件の型と基本ユーティリティ
  score/         符・翻から点数を算出（calculateScore）
  decomposition/ 手牌の面子分解（decomposeHand）
  yaku/          役判定（judgeYaku）
  engine/        符計算 + 統合（calculateHandScore、高点法）
  lib/           UI 用の牌ヘルパー
  App.tsx        計算画面
tests/           spec / unit / invariants の 3 層
scripts/         check.sh（CI の入口）・fmt.sh・next-issue.py・release.sh
```

## ライセンス

[MIT](./LICENSE)
