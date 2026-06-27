import {
  describe, expect, it
} from 'vitest';

import {
  honorTile, suitedTile, type Tile
} from '../domain/index.ts';
import {
  addTileToHand, HAND_SIZE
} from './tiles.ts';

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
