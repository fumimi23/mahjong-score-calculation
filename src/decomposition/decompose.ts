// 面子分解ロジック [#16]
//
// 手牌（純手牌 + 副露 + 和了牌）から和了形（通常手 / 七対子 / 国士無双）を全列挙する。
// 通常手は 4 面子 1 雀頭への分解で、複数解があれば全て返す（高点法は後段 #15/#17 で選ぶ）。
// 各分解は和了牌の待ち形（両面/嵌張/辺張/双碰/単騎）を持つ。
//
// 明暗は構造のみを反映する（暗 = 門前で完成 / 明 = 副露）。
// ロンで完成した刻子を明刻として扱う符の補正は win-type 依存のため、本モジュールでは行わず #15/#17 に委ねる。

import {
  type Furo,
  type FuroType,
  type Hand,
  type Honor,
  honorTile,
  isSuited,
  type Mentsu,
  type MentsuType,
  type Rank,
  sortTiles,
  type Suit,
  suitedTile,
  type Tile,
  tilesEqual,
  type WaitType
} from '../domain/index.ts';

export type HandForm = 'kokushi' | 'sevenPairs' | 'standard';

export type HandDecomposition = {
  readonly form: HandForm
  // 雀頭を含む全構成。standard: 4 面子 + 1 雀頭（計 5）/ sevenPairs: 7 対子 / kokushi: 空。
  readonly mentsu: readonly Mentsu[]
  // 和了牌の待ち形。kokushi は null。
  readonly wait: null | WaitType
  // 和了牌が完成させた mentsu の添字。kokushi は -1。
  readonly winningMentsuIndex: number
};

// 34 種の牌インデックス: 0-8 萬子 / 9-17 筒子 / 18-26 索子 / 27-33 字牌。
const SUIT_BY_BLOCK: readonly Suit[] = [
  'man',
  'pin',
  'sou'
];

// 字牌のインデックス順（tile.ts の並び順に一致: 東南西北白發中）。
const HONOR_INDEX_ORDER: readonly Honor[] = [
  'east',
  'south',
  'west',
  'north',
  'white',
  'green',
  'red'
];

// 国士無双の対象牌（么九牌）のインデックス。
const KOKUSHI_INDICES: readonly number[] = [
  0,
  8,
  9,
  17,
  18,
  26,
  27,
  28,
  29,
  30,
  31,
  32,
  33
];

const FURO_MENTSU_TYPE: Record<FuroType, MentsuType> = {
  ankan: 'kantsu',
  chi: 'shuntsu',
  daiminkan: 'kantsu',
  kakan: 'kantsu',
  pon: 'kotsu',
};

const indexToTile = (index: number): Tile => {
  if (index < 27) {
    const suit = SUIT_BY_BLOCK[Math.floor(index / 9)];
    const rank = (index % 9) + 1;
    return suitedTile(suit,
      rank as Rank);
  }
  return honorTile(HONOR_INDEX_ORDER[index - 27]);
};

const tileToIndex = (tile: Tile): number => {
  if (isSuited(tile)) {
    return SUIT_BY_BLOCK.indexOf(tile.suit) * 9 + (tile.rank - 1);
  }
  return 27 + HONOR_INDEX_ORDER.indexOf(tile.honor);
};

const countsFromTiles = (tiles: readonly Tile[]): number[] => {
  const counts = new Array<number>(34).fill(0);
  for (const tile of tiles) {
    counts[tileToIndex(tile)] += 1;
  }
  return counts;
};

const makePair = (index: number): Mentsu => {
  const tile = indexToTile(index);
  return {
    isOpen: false,
    tiles: [
      tile,
      tile
    ],
    type: 'pair',
  };
};

const makeKotsu = (index: number): Mentsu => {
  const tile = indexToTile(index);
  return {
    isOpen: false,
    tiles: [
      tile,
      tile,
      tile
    ],
    type: 'kotsu',
  };
};

const makeShuntsu = (index: number): Mentsu => {
  return {
    isOpen: false,
    tiles: [
      indexToTile(index),
      indexToTile(index + 1),
      indexToTile(index + 2)
    ],
    type: 'shuntsu',
  };
};

const furoToMentsu = (furo: Furo): Mentsu => {
  return {
    isOpen: furo.type !== 'ankan',
    tiles: furo.tiles,
    type: FURO_MENTSU_TYPE[furo.type],
  };
};

// counts を破壊的に操作しながら、全ての牌を面子（順子・刻子）に分解する全パターンを列挙する。
const enumerateMelds = (counts: number[]): Mentsu[][] => {
  let lowest = -1;
  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i] > 0) {
      lowest = i;
      break;
    }
  }
  if (lowest === -1) {
    return [
      [
      ]
    ];
  }

  const results: Mentsu[][] = [
  ];

  if (counts[lowest] >= 3) {
    counts[lowest] -= 3;
    for (const sub of enumerateMelds(counts)) {
      results.push([
        makeKotsu(lowest),
        ...sub
      ]);
    }
    counts[lowest] += 3;
  }

  const canSequence = lowest < 27
    && lowest % 9 <= 6
    && counts[lowest + 1] > 0
    && counts[lowest + 2] > 0;
  if (canSequence) {
    counts[lowest] -= 1;
    counts[lowest + 1] -= 1;
    counts[lowest + 2] -= 1;
    for (const sub of enumerateMelds(counts)) {
      results.push([
        makeShuntsu(lowest),
        ...sub
      ]);
    }
    counts[lowest] += 1;
    counts[lowest + 1] += 1;
    counts[lowest + 2] += 1;
  }

  return results;
};

// 順子における和了牌の待ち形を求める（牌は昇順に整列済み前提）。
const classifyShuntsuWait = (meld: Mentsu, winningTile: Tile): WaitType => {
  const low = meld.tiles[0];
  if (!isSuited(low) || !isSuited(winningTile)) {
    return 'ryanmen';
  }
  const lowRank = low.rank;
  const winRank = winningTile.rank;
  if (winRank === lowRank + 1) {
    return 'kanchan';
  }
  if (winRank === lowRank) {
    // 下端で和了。789 を持って 7 待ち（=789 の low が 7）のみ辺張。
    return lowRank === 7 ? 'penchan' : 'ryanmen';
  }
  // 上端で和了。123 を持って 3 待ち（=123 の low が 1）のみ辺張。
  return lowRank === 1 ? 'penchan' : 'ryanmen';
};

const classifyWait = (meld: Mentsu, winningTile: Tile): null | WaitType => {
  switch (meld.type) {
    case 'kantsu': {
      // 槓は待ちにならない。
      return null;
    }
    case 'kotsu': {
      return 'shanpon';
    }
    case 'pair': {
      return 'tanki';
    }
    case 'shuntsu': {
      return classifyShuntsuWait(meld,
        winningTile);
    }
  }
};

const tileId = (tile: Tile): string => {
  if (isSuited(tile)) {
    return `${tile.suit}${tile.rank}`;
  }
  return tile.honor;
};

const decompositionKey = (decomposition: HandDecomposition): string => {
  const meldKeys = decomposition.mentsu.map((meld) => {
    const tiles = meld.tiles.map((tile) => {
      return tileId(tile);
    }).join(',');
    return `${meld.type}:${tiles}`;
  });
  meldKeys.sort();
  return `${decomposition.form}/${decomposition.wait ?? '-'}/${meldKeys.join('|')}`;
};

const dedupe = (decompositions: readonly HandDecomposition[]): HandDecomposition[] => {
  const seen = new Set<string>();
  const result: HandDecomposition[] = [
  ];
  for (const decomposition of decompositions) {
    const key = decompositionKey(decomposition);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(decomposition);
  }
  return result;
};

const decomposeStandard = (
  set: readonly Tile[],
  furoMentsu: readonly Mentsu[],
  meldsNeeded: number,
  winningTile: Tile
): HandDecomposition[] => {
  if (set.length !== meldsNeeded * 3 + 2) {
    return [
    ];
  }
  const counts = countsFromTiles(set);
  const decompositions: HandDecomposition[] = [
  ];

  for (let pair = 0; pair < 34; pair += 1) {
    if (counts[pair] < 2) {
      continue;
    }
    counts[pair] -= 2;
    const partitions = enumerateMelds(counts);
    counts[pair] += 2;
    if (partitions.length === 0) {
      continue;
    }
    const pairMeld = makePair(pair);

    for (const partition of partitions) {
      const allMelds = [
        ...furoMentsu,
        ...partition,
        pairMeld
      ];
      for (let m = 0; m < partition.length; m += 1) {
        const meld = partition[m];
        const contains = meld.tiles.some((tile) => {
          return tilesEqual(tile,
            winningTile);
        });
        if (!contains) {
          continue;
        }
        const wait = classifyWait(meld,
          winningTile);
        if (wait === null) {
          continue;
        }
        decompositions.push({
          form: 'standard',
          mentsu: allMelds,
          wait,
          winningMentsuIndex: furoMentsu.length + m,
        });
      }
      const pairHasWinningTile = pairMeld.tiles.some((tile) => {
        return tilesEqual(tile,
          winningTile);
      });
      if (pairHasWinningTile) {
        decompositions.push({
          form: 'standard',
          mentsu: allMelds,
          wait: 'tanki',
          winningMentsuIndex: allMelds.length - 1,
        });
      }
    }
  }

  return decompositions;
};

const decomposeSevenPairs = (set: readonly Tile[], winningTile: Tile): HandDecomposition[] => {
  if (set.length !== 14) {
    return [
    ];
  }
  const counts = countsFromTiles(set);
  const pairIndices: number[] = [
  ];
  for (let i = 0; i < 34; i += 1) {
    if (counts[i] === 0) {
      continue;
    }
    if (counts[i] !== 2) {
      return [
      ];
    }
    pairIndices.push(i);
  }
  if (pairIndices.length !== 7) {
    return [
    ];
  }
  const mentsu = pairIndices.map((index) => {
    return makePair(index);
  });
  return [
    {
      form: 'sevenPairs',
      mentsu,
      wait: 'tanki',
      winningMentsuIndex: pairIndices.indexOf(tileToIndex(winningTile)),
    }
  ];
};

const decomposeKokushi = (set: readonly Tile[]): HandDecomposition[] => {
  if (set.length !== 14) {
    return [
    ];
  }
  const counts = countsFromTiles(set);
  for (let i = 0; i < 34; i += 1) {
    if (counts[i] > 0 && !KOKUSHI_INDICES.includes(i)) {
      return [
      ];
    }
  }
  let pairCount = 0;
  for (const index of KOKUSHI_INDICES) {
    if (counts[index] === 0) {
      return [
      ];
    }
    if (counts[index] === 2) {
      pairCount += 1;
    }
    else if (counts[index] !== 1) {
      return [
      ];
    }
  }
  if (pairCount !== 1) {
    return [
    ];
  }
  return [
    {
      form: 'kokushi',
      mentsu: [
      ],
      wait: null,
      winningMentsuIndex: -1,
    }
  ];
};

export const decomposeHand = (hand: Hand): HandDecomposition[] => {
  const furoMentsu = hand.furo.map((furo) => {
    return furoToMentsu(furo);
  });
  const meldsNeeded = 4 - furoMentsu.length;
  if (meldsNeeded < 0) {
    return [
    ];
  }
  const set = sortTiles([
    ...hand.concealed,
    hand.winningTile
  ]);

  const results: HandDecomposition[] = [
  ];
  if (hand.furo.length === 0) {
    results.push(...decomposeSevenPairs(set,
      hand.winningTile));
    results.push(...decomposeKokushi(set));
  }
  results.push(...decomposeStandard(
    set,
    furoMentsu,
    meldsNeeded,
    hand.winningTile
  ));

  return dedupe(results);
};
