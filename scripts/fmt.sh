#!/bin/sh
# 整形の適用(ESLint --fix。整形ルールは @stylistic が持つ)。
# 差分の検査だけなら scripts/check.sh。
set -e
cd "$(CDPATH= cd "$(dirname "$0")/.." && pwd)"
yarn format
