// 和了条件（ツモ/ロン・場風/自風・和了条件フラグ・ドラ）のドメイン型

import {
  type Tile, type Wind
} from './tile.ts';

export type WinType = 'ron' | 'tsumo';

// 和了条件フラグ（→ #5 条件選択）。ツモ・場風・自風は別フィールドで持つ。
export type WinningConditions = {
  readonly chankan: boolean // 槍槓
  readonly doubleRiichi: boolean // ダブリー
  readonly haitei: boolean // 海底
  readonly houtei: boolean // 河底
  readonly ippatsu: boolean // 一発
  readonly riichi: boolean // リーチ
  readonly rinshan: boolean // 嶺上
};

// ドラ（→ #6 ドラ選択）。赤ドラは各牌の isRedDora で表す。
export type Dora = {
  readonly indicators: readonly Tile[]
  readonly uraIndicators: readonly Tile[]
};

export type WinningContext = {
  readonly conditions: WinningConditions
  readonly dora: Dora
  readonly roundWind: Wind
  readonly seatWind: Wind
  readonly winType: WinType
};
