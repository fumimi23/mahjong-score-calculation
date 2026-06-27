import {
  describe, expect, it
} from 'vitest';

import {
  type Furo, honorTile, isSuited, suitedTile, type Tile
} from '../domain/index.ts';
import {
  addTileToHand, buildFuro, HAND_SIZE, toggleRedFive, toggleRedInFuro
} from './tiles.ts';

const isRedAt = (tiles: readonly Tile[], index: number): boolean => {
  const tile = tiles[index];
  return isSuited(tile) && tile.isRedDora;
};

describe('addTileToHand',
  () => {
    it('空の手牌に追加できる',
      () => {
        const result = addTileToHand([
        ],
        suitedTile('man',
          1));
        expect(result).toHaveLength(1);
      });

    it('同じ牌は4枚まで（5枚目は追加されない）',
      () => {
        const four: Tile[] = [
          suitedTile('man',
            1),
          suitedTile('man',
            1),
          suitedTile('man',
            1),
          suitedTile('man',
            1)
        ];
        const result = addTileToHand(four,
          suitedTile('man',
            1));
        expect(result).toHaveLength(4);
      });

    it('赤ドラ違いでも同じ牌として4枚制限',
      () => {
        const four: Tile[] = [
          suitedTile('pin',
            5),
          suitedTile('pin',
            5),
          suitedTile('pin',
            5),
          suitedTile('pin',
            5,
            true)
        ];
        const result = addTileToHand(four,
          suitedTile('pin',
            5));
        expect(result).toHaveLength(4);
      });

    it('字牌も4枚まで',
      () => {
        const four: Tile[] = [
          honorTile('east'),
          honorTile('east'),
          honorTile('east'),
          honorTile('east')
        ];
        const result = addTileToHand(four,
          honorTile('east'));
        expect(result).toHaveLength(4);
      });

    it('手牌が HAND_SIZE 枚あるとそれ以上追加されない',
      () => {
        const full: Tile[] = Array.from({
          length: HAND_SIZE,
        },
        (_, index) => {
          return suitedTile('sou',
            ((index % 9) + 1) as 1);
        });
        const result = addTileToHand(full,
          honorTile('white'));
        expect(result).toHaveLength(HAND_SIZE);
      });
  });

describe('toggleRedFive',
  () => {
    it('5を赤に切り替える',
      () => {
        const tiles: Tile[] = [
          suitedTile('man',
            5)
        ];
        const result = toggleRedFive(tiles,
          0);
        expect(isRedAt(result,
          0)).toBe(true);
      });

    it('もう一度で赤を解除する',
      () => {
        const tiles: Tile[] = [
          suitedTile('man',
            5,
            true)
        ];
        const result = toggleRedFive(tiles,
          0);
        expect(isRedAt(result,
          0)).toBe(false);
      });

    it('同じ色の赤5は1枚まで（別の5を赤にすると前のは解除）',
      () => {
        const tiles: Tile[] = [
          suitedTile('man',
            5,
            true),
          suitedTile('man',
            5)
        ];
        const result = toggleRedFive(tiles,
          1);
        expect(isRedAt(result,
          0)).toBe(false);
        expect(isRedAt(result,
          1)).toBe(true);
      });

    it('5以外は変化しない',
      () => {
        const tiles: Tile[] = [
          suitedTile('man',
            4)
        ];
        const result = toggleRedFive(tiles,
          0);
        expect(isRedAt(result,
          0)).toBe(false);
      });
  });

describe('buildFuro',
  () => {
    it('ポンは同じ牌3枚',
      () => {
        const furo = buildFuro('pon',
          suitedTile('man',
            5));
        expect(furo?.type).toBe('pon');
        expect(furo?.tiles).toHaveLength(3);
        expect(furo?.calledFrom).toBe('shimocha');
      });

    it('チーは連続3枚・上家から',
      () => {
        const furo = buildFuro('chi',
          suitedTile('man',
            3));
        expect(furo?.type).toBe('chi');
        expect(furo?.tiles).toHaveLength(3);
        expect(furo?.calledFrom).toBe('kamicha');
        const ranks = furo?.tiles.map((tile) => {
          return isSuited(tile) ? tile.rank : 0;
        });
        expect(ranks).toStrictEqual([
          3,
          4,
          5
        ]);
      });

    it('チーは8以上の数牌では作れない',
      () => {
        expect(buildFuro('chi',
          suitedTile('man',
            8))).toBeNull();
      });

    it('チーは字牌では作れない',
      () => {
        expect(buildFuro('chi',
          honorTile('east'))).toBeNull();
      });

    it('暗槓は4枚・鳴き元なし',
      () => {
        const furo = buildFuro('ankan',
          suitedTile('pin',
            2));
        expect(furo?.type).toBe('ankan');
        expect(furo?.tiles).toHaveLength(4);
        expect(furo?.calledFrom).toBeNull();
      });

    it('大明槓は4枚・鳴き元あり',
      () => {
        const furo = buildFuro('daiminkan',
          suitedTile('pin',
            2));
        expect(furo?.tiles).toHaveLength(4);
        expect(furo?.calledFrom).toBe('shimocha');
      });

    it('加槓は4枚・鳴き元あり（門前ではない）',
      () => {
        const furo = buildFuro('kakan',
          suitedTile('pin',
            2));
        expect(furo?.type).toBe('kakan');
        expect(furo?.tiles).toHaveLength(4);
        expect(furo?.calledFrom).toBe('shimocha');
      });
  });

describe('toggleRedInFuro',
  () => {
    const ponOf5 = (): Furo => {
      const furo = buildFuro('pon',
        suitedTile('man',
          5));
      if (furo === null) {
        throw new Error('ポンの生成に失敗');
      }
      return furo;
    };

    it('副露内の5を赤に切り替える',
      () => {
        const result = toggleRedInFuro([
          ponOf5()
        ],
        0,
        0);
        const tile = result[0].tiles[0];
        expect(isSuited(tile) && tile.isRedDora).toBe(true);
      });

    it('同じ面子内の赤5は1枚まで（別の5を赤にすると前のは解除）',
      () => {
        const reddened = toggleRedInFuro([
          ponOf5()
        ],
        0,
        0);
        const result = toggleRedInFuro(reddened,
          0,
          1);
        expect(isSuited(result[0].tiles[0]) && result[0].tiles[0].isRedDora).toBe(false);
        expect(isSuited(result[0].tiles[1]) && result[0].tiles[1].isRedDora).toBe(true);
      });

    it('5以外は変化しない',
      () => {
        const chi = buildFuro('chi',
          suitedTile('man',
            1));
        if (chi === null) {
          throw new Error('チーの生成に失敗');
        }
        const result = toggleRedInFuro([
          chi
        ],
        0,
        0);
        expect(isSuited(result[0].tiles[0]) && result[0].tiles[0].isRedDora).toBe(false);
      });
  });
