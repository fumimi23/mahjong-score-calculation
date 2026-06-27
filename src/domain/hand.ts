// 手牌（純手牌・副露・和了牌）のドメイン型

import {
  type Tile
} from './tile.ts';

// ankan: 暗槓 / minkan: 明槓 / pon: ポン / chi: チー
export type FuroType = 'ankan' | 'chi' | 'minkan' | 'pon';

// 鳴き元（上家・対面・下家）。暗槓は鳴き元が無いため null。
export type CalledFrom = 'kamicha' | 'shimocha' | 'toimen';

export type Furo = {
  readonly calledFrom: CalledFrom | null
  readonly tiles: readonly Tile[]
  readonly type: FuroType
};

export type Hand = {
  readonly concealed: readonly Tile[]
  readonly furo: readonly Furo[]
  readonly winningTile: Tile
};
