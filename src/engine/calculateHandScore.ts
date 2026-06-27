// 点数統合（高点法）[#22]
//
// 手牌 + 和了条件から最終得点を求める。面子分解（#16）→ 役判定（#17）→ 符計算 → 点数算出（#15）を繋ぎ、
// 複数の分解のうち最も高い点になる解（高点法）を採用する。役満は 8000×倍数 で別計算。役無しは null。

import {
  decomposeHand
} from '../decomposition/index.ts';
import {
  type Hand,
  type WinningContext
} from '../domain/index.ts';
import {
  calculateScore,
  paymentsFromBase,
  type ScorePayments
} from '../score/index.ts';
import {
  buildYakuInput,
  isMenzenHand,
  judgeYaku,
  type Yaku
} from '../yaku/index.ts';
import {
  calculateFu
} from './fu.ts';

const YAKUMAN_BASE = 8000;

export type HandScore = {
  readonly fu: number // 役満時は 0
  readonly han: number // 役満時は 0
  readonly payments: ScorePayments
  readonly total: number // 和了者の総得点
  readonly yaku: readonly Yaku[] // 通常役（ドラ含む）。役満時は空。
  readonly yakuman: readonly string[] // 役満名（要素数 = 倍数）
};

export const calculateHandScore = (hand: Hand, context: WinningContext): HandScore | null => {
  const decompositions = decomposeHand(hand);
  if (decompositions.length === 0) {
    return null; // 和了形でない。
  }

  const isMenzen = isMenzenHand(hand);
  const isDealer = context.seatWind === 'east'; // 親 = 東家

  const candidates: HandScore[] = [
  ];
  for (const decomposition of decompositions) {
    const yakuResult = judgeYaku(buildYakuInput(
      hand,
      decomposition,
      context
    ));

    if (yakuResult.yakuman.length > 0) {
      const base = YAKUMAN_BASE * yakuResult.yakuman.length;
      const {
        payments, total,
      } = paymentsFromBase(
        base,
        isDealer,
        context.winType
      );
      candidates.push({
        fu: 0,
        han: 0,
        payments,
        total,
        yaku: [
        ],
        yakuman: yakuResult.yakuman,
      });
      continue;
    }

    if (yakuResult.han === 0) {
      continue; // 役無し（ドラのみ等）は和了不成立。
    }

    const isPinfu = yakuResult.yaku.some((yaku) => {
      return yaku.name === '平和';
    });
    const fu = calculateFu(
      decomposition,
      context,
      isMenzen,
      isPinfu
    );
    const score = calculateScore({
      fu,
      han: yakuResult.han,
      isDealer,
      winType: context.winType,
    });
    candidates.push({
      fu: score.fu,
      han: yakuResult.han,
      payments: score.payments,
      total: score.total,
      yaku: yakuResult.yaku,
      yakuman: [
      ],
    });
  }

  if (candidates.length === 0) {
    return null; // 役無し。
  }

  return candidates.reduce((best, current) => {
    return current.total > best.total ? current : best;
  });
};
