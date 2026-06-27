import {
  describe, expect, it
} from 'vitest';

import {
  type Hand, honorTile, type Rank, type Suit, suitedTile, type Tile
} from '../domain/index.ts';
import {
  decomposeHand
} from './decompose.ts';

// '234' のような並びから数牌の配列を作る。
const suited = (suit: Suit, ranks: string): Tile[] => {
  return [
    ...ranks
  ].map((rank) => {
    return suitedTile(suit,
      Number(rank) as Rank);
  });
};

const hand = (concealed: Tile[], winningTile: Tile, furo: Hand['furo'] = [
]): Hand => {
  return {
    concealed,
    furo,
    winningTile,
  };
};

describe('decomposeHand',
  () => {
    describe('待ち形（通常手・単一解）',
      () => {
        it('単騎: 雀頭で和了',
          () => {
            const concealed = [
              ...suited('man',
                '234567'),
              ...suited('pin',
                '234567'),
              ...suited('sou',
                '9')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('sou',
                9)));
            expect(result).toHaveLength(1);
            expect(result[0].form).toBe('standard');
            expect(result[0].wait).toBe('tanki');
            expect(result[0].mentsu).toHaveLength(5);
          });

        it('両面',
          () => {
            const concealed = [
              ...suited('man',
                '234567'),
              ...suited('pin',
                '23456'),
              ...suited('sou',
                '99')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('pin',
                7)));
            expect(result).toHaveLength(1);
            expect(result[0].wait).toBe('ryanmen');
          });

        it('嵌張',
          () => {
            const concealed = [
              ...suited('man',
                '13567'),
              ...suited('pin',
                '234678'),
              ...suited('sou',
                '99')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('man',
                2)));
            expect(result).toHaveLength(1);
            expect(result[0].wait).toBe('kanchan');
          });

        it('辺張',
          () => {
            const concealed = [
              ...suited('man',
                '12456789'),
              ...suited('pin',
                '234'),
              ...suited('sou',
                '99')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('man',
                3)));
            expect(result).toHaveLength(1);
            expect(result[0].wait).toBe('penchan');
          });

        it('双碰',
          () => {
            const concealed = [
              ...suited('man',
                '234567'),
              ...suited('pin',
                '23455'),
              ...suited('sou',
                '99')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('pin',
                5)));
            expect(result).toHaveLength(1);
            expect(result[0].wait).toBe('shanpon');
          });
      });

    describe('複数解の列挙',
      () => {
        it('222333444 は刻子3つと順子3つの2解',
          () => {
            const concealed = [
              ...suited('man',
                '222333444'),
              ...suited('pin',
                '567'),
              ...suited('sou',
                '9')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('sou',
                9)));
            expect(result).toHaveLength(2);
            for (const decomposition of result) {
              expect(decomposition.wait).toBe('tanki');
            }
            const types = result.map((decomposition) => {
              return decomposition.mentsu.map((meld) => {
                return meld.type;
              }).sort().join(',');
            });
            expect(new Set(types).size).toBe(2);
          });
      });

    describe('特殊形',
      () => {
        it('七対子',
          () => {
            const concealed = [
              ...suited('man',
                '11223344'),
              ...suited('pin',
                '5566'),
              ...suited('sou',
                '9')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('sou',
                9)));
            expect(result).toHaveLength(1);
            expect(result[0].form).toBe('sevenPairs');
            expect(result[0].wait).toBe('tanki');
            expect(result[0].mentsu).toHaveLength(7);
          });

        it('国士無双',
          () => {
            const concealed = [
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
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('man',
                1)));
            expect(result).toHaveLength(1);
            expect(result[0].form).toBe('kokushi');
            expect(result[0].wait).toBeNull();
            expect(result[0].mentsu).toHaveLength(0);
          });
      });

    describe('副露あり',
      () => {
        it('ポン1つ + 門前3面子1雀頭',
          () => {
            const concealed = [
              ...suited('man',
                '234567'),
              ...suited('pin',
                '234'),
              ...suited('sou',
                '9')
            ];
            const furo: Hand['furo'] = [
              {
                calledFrom: 'shimocha',
                tiles: [
                  suitedTile('pin',
                    1),
                  suitedTile('pin',
                    1),
                  suitedTile('pin',
                    1)
                ],
                type: 'pon',
              }
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('sou',
                9),
              furo));
            expect(result).toHaveLength(1);
            expect(result[0].form).toBe('standard');
            expect(result[0].wait).toBe('tanki');
            expect(result[0].mentsu).toHaveLength(5);
            expect(result[0].mentsu[0].isOpen).toBe(true);
            expect(result[0].mentsu[0].type).toBe('kotsu');
          });
      });

    describe('待ち形（端のケース）',
      () => {
        it('両面: 78を持って上端9で和了（辺張ではない）',
          () => {
            const concealed = [
              ...suited('man',
                '78'),
              ...suited('pin',
                '234567'),
              ...suited('sou',
                '234'),
              ...suited('sou',
                '99')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('man',
                9)));
            expect(result).toHaveLength(1);
            expect(result[0].wait).toBe('ryanmen');
          });

        it('辺張: 89を持って7で和了',
          () => {
            const concealed = [
              ...suited('man',
                '89'),
              ...suited('pin',
                '234567'),
              ...suited('sou',
                '234'),
              ...suited('sou',
                '99')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('man',
                7)));
            expect(result).toHaveLength(1);
            expect(result[0].wait).toBe('penchan');
          });
      });

    describe('マルチ待ち（1つの和了牌で複数解）',
      () => {
        it('4556 + 5 は嵌張と単騎の2解',
          () => {
            const concealed = [
              ...suited('man',
                '4556'),
              ...suited('pin',
                '234567'),
              ...suited('sou',
                '234')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('man',
                5)));
            const waits = new Set(result.map((decomposition) => {
              return decomposition.wait;
            }));
            expect(waits.has('kanchan')).toBe(true);
            expect(waits.has('tanki')).toBe(true);
          });
      });

    describe('和了形でない手',
      () => {
        it('分解できなければ空配列',
          () => {
            const concealed = [
              ...suited('man',
                '234567'),
              ...suited('pin',
                '234568'),
              ...suited('sou',
                '9')
            ];
            const result = decomposeHand(hand(concealed,
              suitedTile('sou',
                9)));
            expect(result).toHaveLength(0);
          });
      });
  });
