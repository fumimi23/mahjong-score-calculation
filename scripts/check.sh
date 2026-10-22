#!/bin/sh
# CI の一連のチェック。
#   手動:     sh scripts/check.sh
#   push 前: .githooks/pre-push から自動実行(有効化は README 参照)
#   Actions: ci.yml(全 push)と deploy.yml(公開前)からも実行する
#
# 新しいチェックを足すときはこのファイルに追記する(CI の単一の入口)。
set -e
cd "$(CDPATH= cd "$(dirname "$0")/.." && pwd)"

# ESLint(整形ルールは @stylistic が持つ)。ここでは整形を「適用」せず違反があれば失敗させる。
# 整形の適用は scripts/fmt.sh。
echo "[check] lint / format"
yarn lint

# deploy の yarn build は tsc -b を含むので、型エラーで公開が落ちる前にここで止める。
echo "[check] typecheck"
yarn tsc -b

# テストは 3 層(spec=約束の台帳 / unit=実装都合 / invariants=横断不変条件)。
# ここでは 3 層すべてを実行する(invariants を除外しない)。拾う範囲は vitest.config.ts の include。
echo "[check] tests"
yarn test

# next-issue.py の選択規則は雛形が配る共通部分なので、プロジェクトのスタックに関わらず実行する。
echo "[check] tests (next-issue.py)"
python3 -m unittest discover -s tests/spec -p "*_test.py"

echo "[check] すべて OK"
