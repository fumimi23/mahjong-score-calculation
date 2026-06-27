import {
  describe, expect, it
} from 'vitest';

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
  calculateHandScore
} from './calculateHandScore.ts';

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

// 平和 + 断么九 になる門前手（雀頭 33s、両面待ち pin7）。
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

describe('calculateHandScore',
  () => {
    it('子 平和+断么九 ロン = 30符2翻 = 2000',
      () => {
        const result = calculateHandScore(pinfuHand(),
          context());
        expect(result).not.toBeNull();
        expect(result?.han).toBe(2);
        expect(result?.fu).toBe(30);
        expect(result?.total).toBe(2000);
      });

    it('子 立直+門前ツモ+平和+断么九 = 20符4翻 = 1300/2600（計5200）',
      () => {
        const result = calculateHandScore(pinfuHand(),
          context({
            conditions: {
              riichi: true,
            },
            winType: 'tsumo',
          }));
        expect(result?.fu).toBe(20);
        expect(result?.han).toBe(4);
        expect(result?.payments).toStrictEqual({
          fromDealer: 2600,
          fromNonDealer: 1300,
          kind: 'tsumo',
        });
        expect(result?.total).toBe(5200);
      });

    it('親 平和+断么九 ロン = 30符2翻 = 2900',
      () => {
        const result = calculateHandScore(pinfuHand(),
          context({
            seatWind: 'east',
          }));
        expect(result?.total).toBe(2900);
      });

    it('七対子 子 ロン = 25符2翻 = 1600',
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
        const result = calculateHandScore(hand,
          context());
        expect(result?.fu).toBe(25);
        expect(result?.han).toBe(2);
        expect(result?.total).toBe(1600);
      });

    it('高点法: 七対子(1600)より二盃口(5200)を採用',
      () => {
        const hand = makeHand([
          ...suited('man',
            '112233'),
          ...suited('pin',
            '445566'),
          ...suited('sou',
            '7')
        ],
        suitedTile('sou',
          7));
        const result = calculateHandScore(hand,
          context());
        expect(result?.yaku.map((yaku) => {
          return yaku.name;
        })).toContain('二盃口');
        expect(result?.total).toBe(5200);
      });

    it('ドラを加算: 平和+断么九+ドラ1 = 30符3翻 = 3900',
      () => {
        const result = calculateHandScore(pinfuHand(),
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
        expect(result?.han).toBe(3);
        expect(result?.total).toBe(3900);
      });

    it('役満 国士無双 子 ロン = 32000',
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
        const result = calculateHandScore(hand,
          context());
        expect(result?.yakuman).toContain('国士無双');
        expect(result?.total).toBe(32000);
      });

    it('副露あり: 白ポン(役牌) 子ロン = 30符1翻 = 1000',
      () => {
        const furo: Hand['furo'] = [
          {
            calledFrom: 'shimocha',
            tiles: [
              honorTile('white'),
              honorTile('white'),
              honorTile('white')
            ],
            type: 'pon',
          }
        ];
        const hand = makeHand([
          ...suited('man',
            '234567'),
          ...suited('pin',
            '234'),
          ...suited('sou',
            '9')
        ],
        suitedTile('sou',
          9),
        furo);
        const result = calculateHandScore(hand,
          context());
        expect(result?.yaku.map((yaku) => {
          return yaku.name;
        })).toContain('役牌（白）');
        expect(result?.total).toBe(1000);
      });

    it('役無し（鳴き・役牌なし・断么九不成立）は null',
      () => {
        const furo: Hand['furo'] = [
          {
            calledFrom: 'kamicha',
            tiles: [
              suitedTile('pin',
                1),
              suitedTile('pin',
                2),
              suitedTile('pin',
                3)
            ],
            type: 'chi',
          }
        ];
        const hand = makeHand([
          ...suited('man',
            '456789'),
          ...suited('sou',
            '234'),
          ...suited('sou',
            '9')
        ],
        suitedTile('sou',
          9),
        furo);
        const result = calculateHandScore(hand,
          context());
        expect(result).toBeNull();
      });

    it('和了形でない手は null',
      () => {
        const hand = makeHand([
          ...suited('man',
            '234567'),
          ...suited('pin',
            '234568'),
          ...suited('sou',
            '9')
        ],
        suitedTile('sou',
          9));
        const result = calculateHandScore(hand,
          context());
        expect(result).toBeNull();
      });
  });
