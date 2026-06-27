import {
  describe, expect, it
} from 'vitest';

import {
  decomposeHand
} from '../decomposition/index.ts';
import {
  type Dora,
  type Hand,
  honorTile,
  type Rank,
  type Suit,
  suitedTile,
  type Tile,
  type Wind,
  type WinningConditions,
  type WinningContext,
  type WinType
} from '../domain/index.ts';
import {
  buildYakuInput, judgeYaku, type YakuResult
} from './judge.ts';

const suited = (suit: Suit, ranks: string): Tile[] => {
  return [
    ...ranks
  ].map((rank) => {
    return suitedTile(suit,
      Number(rank) as Rank);
  });
};

const makeHand = (concealed: Tile[], winningTile: Tile, furo: Hand['furo'] = [
]): Hand => {
  return {
    concealed,
    furo,
    winningTile,
  };
};

const baseConditions: WinningConditions = {
  chankan: false,
  doubleRiichi: false,
  haitei: false,
  houtei: false,
  ippatsu: false,
  riichi: false,
  rinshan: false,
};

type ContextOverride = {
  conditions?: Partial<WinningConditions>
  dora?: Dora
  roundWind?: Wind
  seatWind?: Wind
  winType?: WinType
};

const context = (over: ContextOverride = {
}): WinningContext => {
  return {
    conditions: {
      ...baseConditions,
      ...over.conditions,
    },
    dora: over.dora ?? {
      indicators: [
      ],
      uraIndicators: [
      ],
    },
    roundWind: over.roundWind ?? 'east',
    seatWind: over.seatWind ?? 'south',
    winType: over.winType ?? 'ron',
  };
};

// 全分解を判定し、役満優先・翻数最大の結果を返す（暫定的な高点法。正式版は #22）。
const judgeBest = (hand: Hand, ctx: WinningContext): YakuResult => {
  const results = decomposeHand(hand).map((decomposition) => {
    return judgeYaku(buildYakuInput(hand,
      decomposition,
      ctx));
  });
  return results.reduce((best, current) => {
    if (current.yakuman.length !== best.yakuman.length) {
      return current.yakuman.length > best.yakuman.length ? current : best;
    }
    return current.han > best.han ? current : best;
  });
};

const names = (result: YakuResult): string[] => {
  return result.yaku.map((yaku) => {
    return yaku.name;
  });
};

// 平和 + 断么九（門前ロン）になる基本手。
const pinfuHand = (): Hand => {
  return makeHand([
    ...suited('man',
      '234567'),
    ...suited('pin',
      '23456'),
    ...suited('sou',
      '33')
  ],
  suitedTile('pin',
    7));
};

describe('judgeYaku',
  () => {
    describe('通常役',
      () => {
        it('平和 + 断么九（門前ロン）',
          () => {
            const result = judgeBest(pinfuHand(),
              context());
            expect(names(result)).toContain('平和');
            expect(names(result)).toContain('断么九');
            expect(result.han).toBe(2);
          });

        it('立直 + 門前清自摸和 + 平和 + 断么九',
          () => {
            const result = judgeBest(pinfuHand(),
              context({
                conditions: {
                  riichi: true,
                },
                winType: 'tsumo',
              }));
            expect(names(result)).toEqual(expect.arrayContaining([
              '立直',
              '門前清自摸和',
              '平和',
              '断么九'
            ]));
            expect(result.han).toBe(4);
          });

        it('役牌（三元牌・白の刻子）',
          () => {
            const hand = makeHand([
              ...suited('man',
                '234567'),
              ...suited('pin',
                '234'),
              honorTile('white'),
              honorTile('white'),
              honorTile('white'),
              ...suited('sou',
                '9')
            ],
            suitedTile('sou',
              9));
            const result = judgeBest(hand,
              context());
            expect(names(result)).toContain('役牌（三元牌）');
            expect(result.han).toBe(1);
          });

        it('対々和 + 三暗刻 + 場風（シャンポンロン）',
          () => {
            const hand = makeHand([
              ...suited('man',
                '222555'),
              ...suited('pin',
                '888'),
              honorTile('east'),
              honorTile('east'),
              ...suited('sou',
                '99')
            ],
            honorTile('east'));
            const result = judgeBest(hand,
              context({
                roundWind: 'east',
                seatWind: 'south',
              }));
            expect(names(result)).toEqual(expect.arrayContaining([
              '対々和',
              '三暗刻',
              '場風'
            ]));
            expect(result.yakuman).toHaveLength(0);
            expect(result.han).toBe(5);
          });

        it('混一色（門前）',
          () => {
            const hand = makeHand([
              ...suited('man',
                '1234567899'),
              honorTile('east'),
              honorTile('east'),
              honorTile('east')
            ],
            suitedTile('man',
              9));
            const result = judgeBest(hand,
              context({
                roundWind: 'west',
                seatWind: 'south',
              }));
            expect(names(result)).toContain('混一色');
          });

        it('清一色 + 二盃口',
          () => {
            const hand = makeHand([
              ...suited('man',
                '234234567567'),
              ...suited('man',
                '9')
            ],
            suitedTile('man',
              9));
            const result = judgeBest(hand,
              context());
            expect(names(result)).toEqual(expect.arrayContaining([
              '清一色',
              '二盃口'
            ]));
          });

        it('七対子',
          () => {
            const hand = makeHand([
              ...suited('man',
                '1133557799'),
              ...suited('pin',
                '22'),
              ...suited('pin',
                '4')
            ],
            suitedTile('pin',
              4));
            const result = judgeBest(hand,
              context());
            expect(names(result)).toContain('七対子');
            expect(result.han).toBe(2);
          });
      });

    describe('ドラ',
      () => {
        it('表ドラを加算（指示牌2m → ドラ3m が1枚）',
          () => {
            const result = judgeBest(pinfuHand(),
              context({
                dora: {
                  indicators: [
                    suitedTile('man',
                      2)
                  ],
                  uraIndicators: [
                  ],
                },
              }));
            expect(names(result)).toContain('ドラ');
            expect(result.han).toBe(3);
          });

        it('赤ドラを加算',
          () => {
            const hand = makeHand([
              ...suited('man',
                '234567'),
              suitedTile('pin',
                2),
              suitedTile('pin',
                3),
              suitedTile('pin',
                4),
              suitedTile('pin',
                5,
                true),
              suitedTile('pin',
                6),
              ...suited('sou',
                '33')
            ],
            suitedTile('pin',
              7));
            const result = judgeBest(hand,
              context());
            expect(names(result)).toContain('赤ドラ');
          });
      });

    describe('役満',
      () => {
        it('国士無双',
          () => {
            const hand = makeHand([
              ...suited('man',
                '19'),
              ...suited('pin',
                '19'),
              ...suited('sou',
                '19'),
              honorTile('east'),
              honorTile('south'),
              honorTile('west'),
              honorTile('north'),
              honorTile('white'),
              honorTile('green'),
              honorTile('red')
            ],
            suitedTile('man',
              1));
            const result = judgeBest(hand,
              context());
            expect(result.yakuman).toContain('国士無双');
          });

        it('大三元',
          () => {
            const hand = makeHand([
              honorTile('white'),
              honorTile('white'),
              honorTile('white'),
              honorTile('green'),
              honorTile('green'),
              honorTile('green'),
              honorTile('red'),
              honorTile('red'),
              honorTile('red'),
              ...suited('man',
                '234'),
              honorTile('east')
            ],
            honorTile('east'));
            const result = judgeBest(hand,
              context());
            expect(result.yakuman).toContain('大三元');
          });

        it('四暗刻（ツモ）',
          () => {
            const hand = makeHand([
              ...suited('man',
                '222555'),
              ...suited('pin',
                '888'),
              honorTile('east'),
              honorTile('east'),
              honorTile('east'),
              ...suited('sou',
                '9')
            ],
            suitedTile('sou',
              9));
            const result = judgeBest(hand,
              context({
                winType: 'tsumo',
              }));
            expect(result.yakuman).toContain('四暗刻');
          });
      });
  });
