// 手牌（純手牌・副露・和了牌）のドメイン型

import {
  type Tile
} from './tile.ts';

// ankan: 暗槓 / daiminkan: 大明槓 / kakan: 加槓 / pon: ポン / chi: チー
// 槓は符・槍槓(#17)の判定で3系統を区別する必要があるため、明槓は大明槓と加槓に分ける。
export type FuroType = 'ankan' | 'chi' | 'daiminkan' | 'kakan' | 'pon';

// 鳴き元（上家・対面・下家）。暗槓は鳴き元が無いため null。
export type CalledFrom = 'kamicha' | 'shimocha' | 'toimen';

export type Furo = {
  readonly calledFrom: CalledFrom | null
  readonly tiles: readonly Tile[]
  readonly type: FuroType
};

export type Hand = {
  // 門前の手牌。和了牌（winningTile）・副露（furo）は含めない。
  readonly concealed: readonly Tile[]
  readonly furo: readonly Furo[]
  readonly winningTile: Tile
};
