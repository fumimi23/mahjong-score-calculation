// UI 用の牌ヘルパー（表示ラベル・牌一覧・キー対応）。

import {
  type Honor,
  honorTile,
  isSuited,
  type Rank,
  type Suit,
  suitedTile,
  type Tile,
  tilesEqual
} from '../domain/index.ts';

// 和了形の総枚数（4面子1雀頭 = 13 + アガリ牌1）。
export const HAND_SIZE = 14;

const MAX_PER_KIND = 4;

const SUIT_LABEL: Record<Suit, string> = {
  man: '萬',
  pin: '筒',
  sou: '索',
};

const HONOR_LABEL: Record<Honor, string> = {
  east: '東',
  green: '發',
  north: '北',
  red: '中',
  south: '南',
  west: '西',
  white: '白',
};

// 表示用ラベル（例: 5萬 / 東 / 白）。
export const tileLabel = (tile: Tile): string => {
  if (isSuited(tile)) {
    return `${tile.rank}${SUIT_LABEL[tile.suit]}`;
  }
  return HONOR_LABEL[tile.honor];
};

// 識別キー（data 属性・React key 用。赤ドラは扱わない）。
export const tileKey = (tile: Tile): string => {
  if (isSuited(tile)) {
    return `${tile.suit}-${tile.rank}`;
  }
  return `honor-${tile.honor}`;
};

const SUIT_ORDER: readonly Suit[] = [
  'man',
  'pin',
  'sou'
];

const HONOR_ORDER: readonly Honor[] = [
  'east',
  'south',
  'west',
  'north',
  'white',
  'green',
  'red'
];

const buildAllTiles = (): Tile[] => {
  const tiles: Tile[] = [
  ];
  for (const suit of SUIT_ORDER) {
    for (let rank = 1; rank <= 9; rank += 1) {
      tiles.push(suitedTile(suit,
        rank as Rank));
    }
  }
  for (const honor of HONOR_ORDER) {
    tiles.push(honorTile(honor));
  }
  return tiles;
};

// ピッカーに並べる 34 種（数牌 → 字牌）。
export const ALL_TILES: readonly Tile[] = buildAllTiles();

const TILE_BY_KEY = new Map<string, Tile>(ALL_TILES.map((tile) => {
  return [
    tileKey(tile),
    tile
  ];
}));

export const tileFromKey = (key: string): Tile | undefined => {
  return TILE_BY_KEY.get(key);
};

// 牌を手牌に追加する。各牌は4枚まで、手牌は HAND_SIZE 枚まで。追加できない場合は元の内容を返す。
export const addTileToHand = (tiles: readonly Tile[], tile: Tile): Tile[] => {
  const sameCount = tiles.filter((current) => {
    return tilesEqual(current,
      tile);
  }).length;
  if (tiles.length >= HAND_SIZE || sameCount >= MAX_PER_KIND) {
    return [
      ...tiles
    ];
  }
  return [
    ...tiles,
    tile
  ];
};

// index の牌（5のみ）の赤ドラ状態を切り替える。同じ色の赤5は1枚までとする。
export const toggleRedFive = (tiles: readonly Tile[], index: number): Tile[] => {
  const target = tiles[index];
  if (target === undefined || !isSuited(target) || target.rank !== 5) {
    return [
      ...tiles
    ];
  }
  const makeRed = !target.isRedDora;
  return tiles.map((tile, i) => {
    if (!isSuited(tile) || tile.rank !== 5 || tile.suit !== target.suit) {
      return tile;
    }
    return suitedTile(tile.suit,
      tile.rank,
      makeRed && i === index);
  });
};
