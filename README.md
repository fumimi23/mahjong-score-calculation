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
yarn format     # ESLint --fix
yarn test       # Vitest（点数計算ロジックの単体テスト）
```

- **テスト**: 点数計算ロジックは純粋関数として Vitest でカバー（既知の点数表と照合）。
- **CI**: `main` 以外も含む push で lint + test を実行（`.github/workflows/ci.yml`）。
- **デプロイ**: `main` への push で GitHub Pages に自動公開（`.github/workflows/deploy.yml`）。

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
```

## ライセンス

[MIT](./LICENSE)
