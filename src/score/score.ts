// 符・点数算出ロジック（翻・符 → 点数）[Phase1]
//
// 入力（翻数・符数・親/子・ツモ/ロン）から、支払い内訳と総得点を求める純粋関数。
// 面子分解（#16）・役判定（#17）はスコープ外。符は呼び出し側が確定済みの値を渡す。
//
// 採用ルール:
//   - 13 翻以上は数え役満（役満扱い）。
//   - 切り上げ満貫は不採用（標準。例: 4 翻 30 符 = 7700）。
//   - 本場・供託の加算はスコープ外（基本点の算出に専念）。

import {
  type WinType
} from '../domain/index.ts';

// 満貫以上の限定役の名称。
export type LimitName = 'baiman' | 'haneman' | 'mangan' | 'sanbaiman' | 'yakuman';

export type ScoreInput = {
  readonly fu: number
  readonly han: number
  readonly isDealer: boolean // 親なら true
  readonly winType: WinType
};

// 支払い内訳。
// ron: 放銃者が fromDiscarder を支払う。
// tsumo: 親なら子全員が fromNonDealer を、子なら親が fromDealer・他の子が fromNonDealer を支払う
//        （親自身がツモした場合は fromDealer は null）。
export type ScorePayments =
  | {
    readonly fromDealer: null | number
    readonly fromNonDealer: number
    readonly kind: 'tsumo'
  }
  | {
    readonly fromDiscarder: number
    readonly kind: 'ron'
  };

export type ScoreResult = {
  readonly base: number // 基本点
  readonly fu: number // 算出に用いた符（丸め後）
  readonly han: number
  readonly limit: LimitName | null // 満貫未満は null
  readonly payments: ScorePayments
  readonly total: number // 和了者の総得点
};

// 限定役の基本点。
const LIMIT_BASE: Record<LimitName, number> = {
  baiman: 4000,
  haneman: 3000,
  mangan: 2000,
  sanbaiman: 6000,
  yakuman: 8000,
};

// 翻数のみで決まる限定役（満貫未満は null）。
const limitFromHan = (han: number): LimitName | null => {
  if (han >= 13) {
    return 'yakuman';
  }
  if (han >= 11) {
    return 'sanbaiman';
  }
  if (han >= 8) {
    return 'baiman';
  }
  if (han >= 6) {
    return 'haneman';
  }
  if (han >= 5) {
    return 'mangan';
  }
  return null;
};

// 100 点単位で切り上げ。
const ceil100 = (value: number): number => {
  return Math.ceil(value / 100) * 100;
};

// 符を 10 符単位で切り上げる。七対子の 25 符はそのまま使う。
const roundFu = (fu: number): number => {
  if (fu === 25) {
    return 25;
  }
  return Math.ceil(fu / 10) * 10;
};

type BaseResolution = {
  readonly base: number
  readonly limit: LimitName | null
};

// 基本点と限定役を求める。4 翻以下でも基本点が 2000 以上なら満貫。
const resolveBase = (han: number, roundedFu: number): BaseResolution => {
  const limit = limitFromHan(han);
  if (limit !== null) {
    return {
      base: LIMIT_BASE[limit],
      limit,
    };
  }
  const rawBase = roundedFu * 2 ** (2 + han);
  if (rawBase >= 2000) {
    return {
      base: LIMIT_BASE.mangan,
      limit: 'mangan',
    };
  }
  return {
    base: rawBase,
    limit: null,
  };
};

export const calculateScore = (input: ScoreInput): ScoreResult => {
  const {
    fu, han, isDealer, winType,
  } = input;
  const roundedFu = roundFu(fu);
  const {
    base, limit,
  } = resolveBase(
    han,
    roundedFu
  );

  if (winType === 'ron') {
    const fromDiscarder = ceil100(base * (isDealer ? 6 : 4));
    return {
      base,
      fu: roundedFu,
      han,
      limit,
      payments: {
        fromDiscarder,
        kind: 'ron',
      },
      total: fromDiscarder,
    };
  }

  if (isDealer) {
    const fromEach = ceil100(base * 2);
    return {
      base,
      fu: roundedFu,
      han,
      limit,
      payments: {
        fromDealer: null,
        fromNonDealer: fromEach,
        kind: 'tsumo',
      },
      total: fromEach * 3,
    };
  }

  const fromDealer = ceil100(base * 2);
  const fromNonDealer = ceil100(base);
  return {
    base,
    fu: roundedFu,
    han,
    limit,
    payments: {
      fromDealer,
      fromNonDealer,
      kind: 'tsumo',
    },
    total: fromDealer + fromNonDealer * 2,
  };
};
