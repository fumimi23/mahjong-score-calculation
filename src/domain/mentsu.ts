// 面子（順子・刻子・槓子・雀頭）のドメイン型

import {
  type Tile
} from './tile.ts';

// shuntsu: 順子 / kotsu: 刻子 / kantsu: 槓子 / pair: 雀頭
export type MentsuType = 'kantsu' | 'kotsu' | 'pair' | 'shuntsu';

export type Mentsu = {
  readonly isOpen: boolean
  readonly tiles: readonly Tile[]
  readonly type: MentsuType
};
