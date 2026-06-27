// UI 用の牌ヘルパー（表示ラベル・牌一覧・キー対応）。

import {
  type Furo,
  type FuroType,
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

// 牌の文字色（萬=黒 / 筒=青 / 索=緑 / 中・赤ドラ=赤 / 發=緑）。
export const tileColorClass = (tile: Tile): string => {
  if (isSuited(tile)) {
    if (tile.isRedDora) {
      return 'text-red-600';
    }
    if (tile.suit === 'pin') {
      return 'text-sky-700';
    }
    if (tile.suit === 'sou') {
      return 'text-emerald-700';
    }
    return 'text-stone-900';
  }
  if (tile.honor === 'red') {
    return 'text-red-600';
  }
  if (tile.honor === 'green') {
    return 'text-emerald-700';
  }
  return 'text-stone-900';
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

// 副露（鳴き）を組み立てる。チーは上家から・数牌の1〜7のみ。作れない場合は null。
export const buildFuro = (type: FuroType, base: Tile): Furo | null => {
  if (type === 'chi') {
    if (!isSuited(base) || base.rank > 7) {
      return null;
    }
    return {
      calledFrom: 'kamicha',
      tiles: [
        base,
        suitedTile(base.suit,
          (base.rank + 1) as Rank),
        suitedTile(base.suit,
          (base.rank + 2) as Rank)
      ],
      type: 'chi',
    };
  }
  if (type === 'pon') {
    return {
      calledFrom: 'shimocha',
      tiles: [
        base,
        base,
        base
      ],
      type: 'pon',
    };
  }
  // ankan / daiminkan / kakan
  return {
    calledFrom: type === 'ankan' ? null : 'shimocha',
    tiles: [
      base,
      base,
      base,
      base
    ],
    type,
  };
};

// 指定スートの5の赤ドラをすべて解除する。
export const clearRedFivesOfSuit = (tiles: readonly Tile[], suit: Suit): Tile[] => {
  return tiles.map((tile) => {
    if (isSuited(tile) && tile.rank === 5 && tile.suit === suit) {
      return suitedTile(suit,
        5,
        false);
    }
    return tile;
  });
};

// 副露内の5（tileIndex）の赤ドラ状態を切り替える。同じ面子内の同色5は1枚まで赤。
export const toggleRedInFuro = (
  furos: readonly Furo[],
  furoIndex: number,
  tileIndex: number
): Furo[] => {
  return furos.map((furo, fi) => {
    if (fi !== furoIndex) {
      return furo;
    }
    const target = furo.tiles[tileIndex];
    if (target === undefined || !isSuited(target) || target.rank !== 5) {
      return furo;
    }
    const makeRed = !target.isRedDora;
    return {
      ...furo,
      tiles: furo.tiles.map((tile, ti) => {
        if (!isSuited(tile) || tile.rank !== 5 || tile.suit !== target.suit) {
          return tile;
        }
        return suitedTile(tile.suit,
          tile.rank,
          makeRed && ti === tileIndex);
      }),
    };
  });
};

// 手牌＋副露を横断した赤5切り替えの結果。
export type RedToggleResult = {
  readonly furos: Furo[]
  readonly hand: Tile[]
};

// 手牌の5（index）の赤を切り替える。赤にする場合は同色の赤5を全副露からも解除し、同色1枚を保証する。
export const toggleHandRedFive = (
  hand: readonly Tile[],
  furos: readonly Furo[],
  index: number
): RedToggleResult => {
  const target = hand[index];
  if (target === undefined || !isSuited(target) || target.rank !== 5) {
    return {
      furos: [
        ...furos
      ],
      hand: [
        ...hand
      ],
    };
  }
  const makeRed = !target.isRedDora;
  return {
    furos: makeRed
      ? furos.map((furo) => {
        return {
          ...furo,
          tiles: clearRedFivesOfSuit(furo.tiles,
            target.suit),
        };
      })
      : [
          ...furos
        ],
    hand: toggleRedFive(hand,
      index),
  };
};

// 副露の5（furoIndex, tileIndex）の赤を切り替える。赤にする場合は同色の赤5を手牌・他の副露からも解除する。
export const toggleFuroRedFive = (
  hand: readonly Tile[],
  furos: readonly Furo[],
  furoIndex: number,
  tileIndex: number
): RedToggleResult => {
  const target = furos[furoIndex]?.tiles[tileIndex];
  if (target === undefined || !isSuited(target) || target.rank !== 5) {
    return {
      furos: [
        ...furos
      ],
      hand: [
        ...hand
      ],
    };
  }
  const makeRed = !target.isRedDora;
  const toggled = toggleRedInFuro(furos,
    furoIndex,
    tileIndex);
  return {
    furos: makeRed
      ? toggled.map((furo, fi) => {
        return fi === furoIndex
          ? furo
          : {
              ...furo,
              tiles: clearRedFivesOfSuit(furo.tiles,
                target.suit),
            };
      })
      : toggled,
    hand: makeRed
      ? clearRedFivesOfSuit(hand,
        target.suit)
      : [
          ...hand
        ],
  };
};
