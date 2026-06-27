import {
  describe, expect, it
} from 'vitest';

import {
  calculateScore, type ScoreInput
} from './score.ts';

// テスト用の入力を組み立てる小さなヘルパー。
const input = (over: Partial<ScoreInput> & Pick<ScoreInput, 'fu' | 'han'>): ScoreInput => {
  return {
    isDealer: false,
    winType: 'ron',
    ...over,
  };
};

describe('calculateScore',
  () => {
    describe('子・ロン',
      () => {
        it('30符1翻 = 1000',
          () => {
            const result = calculateScore(input({
              fu: 30,
              han: 1,
            }));
            expect(result.payments).toStrictEqual({
              fromDiscarder: 1000,
              kind: 'ron',
            });
            expect(result.total).toBe(1000);
            expect(result.limit).toBeNull();
          });

        it('30符4翻 = 7700（満貫未満）',
          () => {
            const result = calculateScore(input({
              fu: 30,
              han: 4,
            }));
            expect(result.total).toBe(7700);
            expect(result.limit).toBeNull();
          });

        it('40符4翻 = 8000（満貫に到達）',
          () => {
            const result = calculateScore(input({
              fu: 40,
              han: 4,
            }));
            expect(result.total).toBe(8000);
            expect(result.limit).toBe('mangan');
            expect(result.base).toBe(2000);
          });
      });

    describe('親・ロン',
      () => {
        it('40符3翻 = 7700',
          () => {
            const result = calculateScore(input({
              fu: 40,
              han: 3,
              isDealer: true,
            }));
            expect(result.total).toBe(7700);
          });

        it('満貫 = 12000',
          () => {
            const result = calculateScore(input({
              fu: 30,
              han: 5,
              isDealer: true,
            }));
            expect(result.total).toBe(12000);
            expect(result.limit).toBe('mangan');
          });
      });

    describe('子・ツモ',
      () => {
        it('20符2翻 = 400/700（子400・親700, 計1500）',
          () => {
            const result = calculateScore(input({
              fu: 20,
              han: 2,
              winType: 'tsumo',
            }));
            expect(result.payments).toStrictEqual({
              fromDealer: 700,
              fromNonDealer: 400,
              kind: 'tsumo',
            });
            expect(result.total).toBe(1500);
          });

        it('30符3翻 = 1000/2000（計4000）',
          () => {
            const result = calculateScore(input({
              fu: 30,
              han: 3,
              winType: 'tsumo',
            }));
            expect(result.payments).toStrictEqual({
              fromDealer: 2000,
              fromNonDealer: 1000,
              kind: 'tsumo',
            });
            expect(result.total).toBe(4000);
          });
      });

    describe('親・ツモ',
      () => {
        it('30符4翻 = 3900オール（計11700）',
          () => {
            const result = calculateScore(input({
              fu: 30,
              han: 4,
              isDealer: true,
              winType: 'tsumo',
            }));
            expect(result.payments).toStrictEqual({
              fromDealer: null,
              fromNonDealer: 3900,
              kind: 'tsumo',
            });
            expect(result.total).toBe(11700);
          });
      });

    describe('限定役（子・ロン）',
      () => {
        it('跳満（6翻）= 12000',
          () => {
            expect(calculateScore(input({
              fu: 30,
              han: 6,
            })).total).toBe(12000);
          });

        it('倍満（8翻）= 16000',
          () => {
            expect(calculateScore(input({
              fu: 30,
              han: 8,
            })).total).toBe(16000);
          });

        it('三倍満（11翻）= 24000',
          () => {
            expect(calculateScore(input({
              fu: 30,
              han: 11,
            })).total).toBe(24000);
          });

        it('数え役満（13翻）= 32000',
          () => {
            const result = calculateScore(input({
              fu: 30,
              han: 13,
            }));
            expect(result.total).toBe(32000);
            expect(result.limit).toBe('yakuman');
          });
      });

    describe('特殊な符',
      () => {
        it('七対子 25符2翻 子ロン = 1600（25符を丸めない）',
          () => {
            const result = calculateScore(input({
              fu: 25,
              han: 2,
            }));
            expect(result.fu).toBe(25);
            expect(result.total).toBe(1600);
          });

        it('端数の符は10符単位に切り上げる（32符→40符）',
          () => {
            const result = calculateScore(input({
              fu: 32,
              han: 1,
            }));
            expect(result.fu).toBe(40);
          });
      });

    describe('限定役・配分内訳',
      () => {
        it('親ロン 跳満（6翻）= 18000',
          () => {
            expect(calculateScore(input({
              fu: 30,
              han: 6,
              isDealer: true,
            })).total).toBe(18000);
          });

        it('子ツモ 跳満（6翻）= 3000/6000（計12000）',
          () => {
            const result = calculateScore(input({
              fu: 30,
              han: 6,
              winType: 'tsumo',
            }));
            expect(result.payments).toStrictEqual({
              fromDealer: 6000,
              fromNonDealer: 3000,
              kind: 'tsumo',
            });
            expect(result.total).toBe(12000);
          });

        it('親ツモ 満貫（5翻）= 4000オール（計12000）',
          () => {
            const result = calculateScore(input({
              fu: 30,
              han: 5,
              isDealer: true,
              winType: 'tsumo',
            }));
            expect(result.payments).toStrictEqual({
              fromDealer: null,
              fromNonDealer: 4000,
              kind: 'tsumo',
            });
            expect(result.total).toBe(12000);
          });

        it('子ツモ 30符4翻 = 2000/3900（計7900・100点切り上げの配分）',
          () => {
            const result = calculateScore(input({
              fu: 30,
              han: 4,
              winType: 'tsumo',
            }));
            expect(result.payments).toStrictEqual({
              fromDealer: 3900,
              fromNonDealer: 2000,
              kind: 'tsumo',
            });
            expect(result.total).toBe(7900);
          });
      });

    describe('不正な入力',
      () => {
        it('翻数が1未満なら例外',
          () => {
            expect(() => {
              return calculateScore(input({
                fu: 30,
                han: 0,
              }));
            }).toThrow(RangeError);
          });

        it('符数が20未満なら例外',
          () => {
            expect(() => {
              return calculateScore(input({
                fu: 19,
                han: 1,
              }));
            }).toThrow(RangeError);
          });

        it('翻数が整数でないなら例外',
          () => {
            expect(() => {
              return calculateScore(input({
                fu: 30,
                han: 1.5,
              }));
            }).toThrow(RangeError);
          });
      });
  });
