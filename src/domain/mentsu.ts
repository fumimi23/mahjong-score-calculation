// 面子（順子・刻子・槓子・雀頭）のドメイン型

import {
  type Tile
} from './tile.ts';

// shuntsu: 順子 / kotsu: 刻子 / kantsu: 槓子 / pair: 雀頭
export type MentsuType = 'kantsu' | 'kotsu' | 'pair' | 'shuntsu';

// 待ち形（符計算で使用。面子分解 #16 で判定）。
// kanchan: 嵌張 / penchan: 辺張 / ryanmen: 両面 / shanpon: 双碰 / tanki: 単騎
export type WaitType = 'kanchan' | 'penchan' | 'ryanmen' | 'shanpon' | 'tanki';

export type Mentsu = {
  // 明＝副露またはロンで完成した面子、暗＝門前で完成した面子。
  // 明暗の最終確定（特にロンで完成した刻子は明刻扱い）は面子分解（#16）で行う。
  // 4面子1雀頭＋待ち＋アガリ位置をまとめた「面子分解の出力型」は #16 で定義する。
  readonly isOpen: boolean
  readonly tiles: readonly Tile[]
  readonly type: MentsuType
};
