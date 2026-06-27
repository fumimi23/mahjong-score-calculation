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
  calculateFu
} from './fu.ts';

const suited = (suit: Suit, ranks: string): Tile[] => {
  return [
    ...ranks
  ].map((rank) => {
    return suitedTile(suit,
      Number(rank) as Rank);
  });
};

const makeHand = (concealed: Tile[], winningTile: Tile): Hand => {
  return {
    concealed,
    furo: [
    ],
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

describe('calculateFu',
  () => {
    it('平和 ロン = 30符',
      () => {
        const hand = makeHand([
          ...suited('man',
            '234567'),
          ...suited('pin',
            '23456'),
          ...suited('sou',
            '33')
        ],
        suitedTile('pin',
          7));
        const decomposition = decomposeHand(hand)[0];
        expect(calculateFu(decomposition,
          context(),
          true,
          true)).toBe(30);
      });

    it('平和 ツモ = 20符',
      () => {
        const hand = makeHand([
          ...suited('man',
            '234567'),
          ...suited('pin',
            '23456'),
          ...suited('sou',
            '33')
        ],
        suitedTile('pin',
          7));
        const decomposition = decomposeHand(hand)[0];
        expect(calculateFu(decomposition,
          context({
            winType: 'tsumo',
          }),
          true,
          true)).toBe(20);
      });

    it('七対子 = 25符',
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
        const decomposition = decomposeHand(hand)[0];
        expect(calculateFu(decomposition,
          context(),
          true,
          false)).toBe(25);
      });

    it('単騎待ち 門前ロン = 20+10+2 = 40符',
      () => {
        const hand = makeHand([
          ...suited('man',
            '234567'),
          ...suited('pin',
            '234567'),
          ...suited('sou',
            '9')
        ],
        suitedTile('sou',
          9));
        const decomposition = decomposeHand(hand)[0];
        expect(calculateFu(decomposition,
          context(),
          true,
          false)).toBe(40);
      });

    it('対々和（暗刻3 + ロン明刻の字牌） 門前ロン = 50符',
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
        const decomposition = decomposeHand(hand)[0];
        expect(calculateFu(decomposition,
          context({
            roundWind: 'east',
            seatWind: 'south',
          }),
          true,
          false)).toBe(50);
      });
  });
