// 牌のドメイン型と基本ユーティリティ

export type Suit = 'man' | 'pin' | 'sou';

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Wind = 'east' | 'north' | 'south' | 'west';

export type Dragon = 'green' | 'red' | 'white';

export type Honor = Dragon | Wind;

// 数牌（萬子・筒子・索子）。isRedDora は赤ドラ（赤五）かどうか。
// 三元牌の Dragon 'red'（中）と区別するため、赤ドラのフラグは isRedDora とする。
export type SuitedTile = {
  readonly isRedDora: boolean
  readonly rank: Rank
  readonly suit: Suit
  readonly type: 'suited'
};

// 字牌（風牌・三元牌）。
export type HonorTile = {
  readonly honor: Honor
  readonly type: 'honor'
};

export type Tile = HonorTile | SuitedTile;

// --- コンストラクタ ---

export const suitedTile = (suit: Suit, rank: Rank, isRedDora = false): SuitedTile => {
  return {
    isRedDora,
    rank,
    suit,
    type: 'suited',
  };
};

export const honorTile = (honor: Honor): HonorTile => {
  return {
    honor,
    type: 'honor',
  };
};

// --- 型ガード ---

export const isSuited = (tile: Tile): tile is SuitedTile => {
  return tile.type === 'suited';
};

export const isHonor = (tile: Tile): tile is HonorTile => {
  return tile.type === 'honor';
};

// --- 比較・正規化 ---

const SUIT_ORDER: Record<Suit, number> = {
  man: 0,
  pin: 1,
  sou: 2,
};

const HONOR_ORDER: Record<Honor, number> = {
  east: 0,
  green: 5,
  north: 3,
  red: 6,
  south: 1,
  west: 2,
  white: 4,
};

// 牌全体の並び順インデックス（数牌 → 字牌）。数牌は赤ドラを区別しない。
const tileOrder = (tile: Tile): number => {
  if (tile.type === 'suited') {
    return SUIT_ORDER[tile.suit] * 9 + (tile.rank - 1);
  }
  return 27 + HONOR_ORDER[tile.honor];
};

// 赤ドラの有無を無視し、同じ種類の牌かどうかを判定する。
export const tilesEqual = (a: Tile, b: Tile): boolean => {
  if (a.type === 'suited' && b.type === 'suited') {
    return a.suit === b.suit && a.rank === b.rank;
  }
  if (a.type === 'honor' && b.type === 'honor') {
    return a.honor === b.honor;
  }
  return false;
};

export const compareTiles = (a: Tile, b: Tile): number => {
  return tileOrder(a) - tileOrder(b);
};

export const sortTiles = (tiles: readonly Tile[]): Tile[] => {
  return [
    ...tiles
  ].sort(compareTiles);
};
