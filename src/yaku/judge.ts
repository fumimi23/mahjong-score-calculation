// 役判定ロジック [#17]
//
// 1つの面子分解（#16）+ 和了条件（#14）から、成立する役と翻数を判定する純粋ロジック。
// リーチ麻雀の標準役（1翻〜役満）・食い下がり・ドラ/赤/裏を扱う。
// 符計算・点数化・高点法（複数分解から最大点を選ぶ）は #22 に委ねる。

import {
  type HandDecomposition
} from '../decomposition/index.ts';
import {
  type Hand,
  type Honor,
  honorTile,
  isHonor,
  isSuited,
  type Mentsu,
  type Rank,
  type Suit,
  type Tile,
  tilesEqual,
  type WinningContext
} from '../domain/index.ts';

export type Yaku = {
  readonly han: number
  readonly name: string
};

export type YakuInput = {
  readonly context: WinningContext
  readonly decomposition: HandDecomposition
  readonly isMenzen: boolean
  readonly tiles: readonly Tile[] // 全14枚（副露・和了牌を含み、赤ドラ情報を保持）
};

export type YakuResult = {
  readonly han: number // 通常役 + ドラの合計翻（役満成立時は 0）
  readonly yaku: readonly Yaku[] // 成立した通常役（ドラ含む）。役満成立時は空。
  readonly yakuman: readonly string[] // 成立した役満名（要素数 = 役満の倍数）
};

const SUITS: readonly Suit[] = [
  'man',
  'pin',
  'sou'
];

const WIND_ORDER: readonly Honor[] = [
  'east',
  'south',
  'west',
  'north'
];

const DRAGON_ORDER: readonly Honor[] = [
  'white',
  'green',
  'red'
];

const isTerminal = (tile: Tile): boolean => {
  return isSuited(tile) && (tile.rank === 1 || tile.rank === 9);
};

const isYaochu = (tile: Tile): boolean => {
  return isHonor(tile) || isTerminal(tile);
};

const isDragon = (honor: Honor): boolean => {
  return honor === 'green' || honor === 'red' || honor === 'white';
};

const isYakuhaiTile = (tile: Tile, context: WinningContext): boolean => {
  if (!isHonor(tile)) {
    return false;
  }
  return isDragon(tile.honor) || tile.honor === context.seatWind || tile.honor === context.roundWind;
};

const meldHead = (meld: Mentsu): Tile => {
  return meld.tiles[0];
};

const isTripletMeld = (meld: Mentsu): boolean => {
  return meld.type === 'kotsu' || meld.type === 'kantsu';
};

const tripletsOf = (decomposition: HandDecomposition): Mentsu[] => {
  return decomposition.mentsu.filter((meld) => {
    return isTripletMeld(meld);
  });
};

const sequencesOf = (decomposition: HandDecomposition): Mentsu[] => {
  return decomposition.mentsu.filter((meld) => {
    return meld.type === 'shuntsu';
  });
};

const pairOf = (decomposition: HandDecomposition): Mentsu | undefined => {
  return decomposition.mentsu.find((meld) => {
    return meld.type === 'pair';
  });
};

// --- 状況役 ---

const detectSituationYaku = (input: YakuInput): Yaku[] => {
  const {
    conditions, winType,
  } = input.context;
  const yaku: Yaku[] = [
  ];
  if (conditions.doubleRiichi) {
    yaku.push({
      han: 2,
      name: 'ダブル立直',
    });
  }
  else if (conditions.riichi) {
    yaku.push({
      han: 1,
      name: '立直',
    });
  }
  if (conditions.ippatsu) {
    yaku.push({
      han: 1,
      name: '一発',
    });
  }
  if (input.isMenzen && winType === 'tsumo') {
    yaku.push({
      han: 1,
      name: '門前清自摸和',
    });
  }
  if (conditions.haitei) {
    yaku.push({
      han: 1,
      name: '海底摸月',
    });
  }
  if (conditions.houtei) {
    yaku.push({
      han: 1,
      name: '河底撈魚',
    });
  }
  if (conditions.rinshan) {
    yaku.push({
      han: 1,
      name: '嶺上開花',
    });
  }
  if (conditions.chankan) {
    yaku.push({
      han: 1,
      name: '槍槓',
    });
  }
  return yaku;
};

// --- 役牌（三元牌・自風・場風）---

const detectYakuhai = (decomposition: HandDecomposition, context: WinningContext): Yaku[] => {
  const yaku: Yaku[] = [
  ];
  for (const meld of tripletsOf(decomposition)) {
    const head = meldHead(meld);
    if (!isHonor(head)) {
      continue;
    }
    if (isDragon(head.honor)) {
      yaku.push({
        han: 1,
        name: '役牌（三元牌）',
      });
    }
    if (head.honor === context.seatWind) {
      yaku.push({
        han: 1,
        name: '自風',
      });
    }
    if (head.honor === context.roundWind) {
      yaku.push({
        han: 1,
        name: '場風',
      });
    }
  }
  return yaku;
};

// --- 牌集合ベースの役 ---

const isTanyao = (tiles: readonly Tile[]): boolean => {
  return tiles.every((tile) => {
    return !isYaochu(tile);
  });
};

const detectFlush = (tiles: readonly Tile[], isMenzen: boolean): null | Yaku => {
  const suits = new Set(tiles.filter(isSuited).map((tile) => {
    return tile.suit;
  }));
  if (suits.size !== 1) {
    return null;
  }
  const hasHonor = tiles.some(isHonor);
  if (hasHonor) {
    return {
      han: isMenzen ? 3 : 2,
      name: '混一色',
    };
  }
  return {
    han: isMenzen ? 6 : 5,
    name: '清一色',
  };
};

const isHonroutou = (tiles: readonly Tile[]): boolean => {
  return tiles.every(isYaochu) && tiles.some(isHonor) && tiles.some(isTerminal);
};

// --- 構造ベースの役（通常手のみ）---

const detectPinfu = (
  decomposition: HandDecomposition,
  context: WinningContext,
  isMenzen: boolean
): null | Yaku => {
  if (!isMenzen) {
    return null;
  }
  if (sequencesOf(decomposition).length !== 4) {
    return null;
  }
  const pair = pairOf(decomposition);
  if (pair === undefined || isYakuhaiTile(meldHead(pair),
    context)) {
    return null;
  }
  if (decomposition.wait !== 'ryanmen') {
    return null;
  }
  return {
    han: 1,
    name: '平和',
  };
};

const shuntsuKey = (meld: Mentsu): string => {
  const head = meld.tiles[0];
  if (!isSuited(head)) {
    return '';
  }
  return `${head.suit}${head.rank}`;
};

const detectPeikou = (decomposition: HandDecomposition, isMenzen: boolean): null | Yaku => {
  if (!isMenzen) {
    return null;
  }
  const counts = new Map<string, number>();
  for (const meld of sequencesOf(decomposition)) {
    const key = shuntsuKey(meld);
    counts.set(key,
      (counts.get(key) ?? 0) + 1);
  }
  let identicalPairs = 0;
  for (const count of counts.values()) {
    identicalPairs += Math.floor(count / 2);
  }
  if (identicalPairs >= 2) {
    return {
      han: 3,
      name: '二盃口',
    };
  }
  if (identicalPairs === 1) {
    return {
      han: 1,
      name: '一盃口',
    };
  }
  return null;
};

const detectSanshokuDoujun = (decomposition: HandDecomposition, isMenzen: boolean): null | Yaku => {
  const sequences = sequencesOf(decomposition);
  for (let low = 1; low <= 7; low += 1) {
    const suits = new Set<Suit>();
    for (const meld of sequences) {
      const head = meld.tiles[0];
      if (isSuited(head) && head.rank === low) {
        suits.add(head.suit);
      }
    }
    if (suits.size === 3) {
      return {
        han: isMenzen ? 2 : 1,
        name: '三色同順',
      };
    }
  }
  return null;
};

const detectSanshokuDoukou = (decomposition: HandDecomposition): null | Yaku => {
  const triplets = tripletsOf(decomposition);
  for (let rank = 1; rank <= 9; rank += 1) {
    const suits = new Set<Suit>();
    for (const meld of triplets) {
      const head = meldHead(meld);
      if (isSuited(head) && head.rank === rank) {
        suits.add(head.suit);
      }
    }
    if (suits.size === 3) {
      return {
        han: 2,
        name: '三色同刻',
      };
    }
  }
  return null;
};

const detectIttsuu = (decomposition: HandDecomposition, isMenzen: boolean): null | Yaku => {
  const sequences = sequencesOf(decomposition);
  for (const suit of SUITS) {
    const lows = new Set<number>();
    for (const meld of sequences) {
      const head = meld.tiles[0];
      if (isSuited(head) && head.suit === suit) {
        lows.add(head.rank);
      }
    }
    if (lows.has(1) && lows.has(4) && lows.has(7)) {
      return {
        han: isMenzen ? 2 : 1,
        name: '一気通貫',
      };
    }
  }
  return null;
};

const detectToitoi = (decomposition: HandDecomposition): null | Yaku => {
  if (sequencesOf(decomposition).length === 0 && tripletsOf(decomposition).length === 4) {
    return {
      han: 2,
      name: '対々和',
    };
  }
  return null;
};

// ロンで完成した刻子（双碰）は明刻扱いとし暗刻に数えない。暗槓は暗刻に数える。
const countAnkou = (decomposition: HandDecomposition, context: WinningContext): number => {
  let count = 0;
  decomposition.mentsu.forEach((meld, index) => {
    if (!isTripletMeld(meld) || meld.isOpen) {
      return;
    }
    const isRonCompleted = context.winType === 'ron'
      && index === decomposition.winningMentsuIndex
      && meld.type === 'kotsu';
    if (isRonCompleted) {
      return;
    }
    count += 1;
  });
  return count;
};

const detectSanankou = (decomposition: HandDecomposition, context: WinningContext): null | Yaku => {
  if (countAnkou(decomposition,
    context) === 3) {
    return {
      han: 2,
      name: '三暗刻',
    };
  }
  return null;
};

const detectSankantsu = (decomposition: HandDecomposition): null | Yaku => {
  const kantsu = decomposition.mentsu.filter((meld) => {
    return meld.type === 'kantsu';
  });
  if (kantsu.length === 3) {
    return {
      han: 2,
      name: '三槓子',
    };
  }
  return null;
};

const detectShousangen = (decomposition: HandDecomposition): null | Yaku => {
  const pair = pairOf(decomposition);
  if (pair === undefined) {
    return null;
  }
  const head = meldHead(pair);
  const pairIsDragon = isHonor(head) && isDragon(head.honor);
  if (dragonTriplets(decomposition).length === 2 && pairIsDragon) {
    return {
      han: 2,
      name: '小三元',
    };
  }
  return null;
};

const everySetHasYaochu = (decomposition: HandDecomposition): boolean => {
  return decomposition.mentsu.every((meld) => {
    return meld.tiles.some(isYaochu);
  });
};

const detectChanta = (
  decomposition: HandDecomposition,
  tiles: readonly Tile[],
  isMenzen: boolean
): null | Yaku => {
  if (sequencesOf(decomposition).length === 0) {
    return null; // 順子が無ければ混老頭（別途）であり、チャンタ系ではない。
  }
  if (!everySetHasYaochu(decomposition)) {
    return null;
  }
  if (tiles.some(isHonor)) {
    return {
      han: isMenzen ? 2 : 1,
      name: '混全帯么九',
    };
  }
  return {
    han: isMenzen ? 3 : 2,
    name: '純全帯么九',
  };
};

const detectStandardYaku = (input: YakuInput): Yaku[] => {
  const {
    context, decomposition, isMenzen, tiles,
  } = input;
  const detectors: (null | Yaku)[] = [
    detectPinfu(decomposition,
      context,
      isMenzen),
    detectPeikou(decomposition,
      isMenzen),
    detectSanshokuDoujun(decomposition,
      isMenzen),
    detectSanshokuDoukou(decomposition),
    detectIttsuu(decomposition,
      isMenzen),
    detectToitoi(decomposition),
    detectSanankou(decomposition,
      context),
    detectSankantsu(decomposition),
    detectShousangen(decomposition),
    detectChanta(decomposition,
      tiles,
      isMenzen)
  ];
  return detectors.filter((yaku): yaku is Yaku => {
    return yaku !== null;
  });
};

// --- ドラ ---

const nextDoraTile = (indicator: Tile): Tile => {
  if (isSuited(indicator)) {
    const rank = indicator.rank === 9 ? 1 : indicator.rank + 1;
    return {
      isRedDora: false,
      rank: rank as Rank,
      suit: indicator.suit,
      type: 'suited',
    };
  }
  const order = isDragon(indicator.honor) ? DRAGON_ORDER : WIND_ORDER;
  const next = order[(order.indexOf(indicator.honor) + 1) % order.length];
  return honorTile(next);
};

const countMatching = (tiles: readonly Tile[], target: Tile): number => {
  return tiles.filter((tile) => {
    return tilesEqual(tile,
      target);
  }).length;
};

const detectDora = (input: YakuInput): Yaku[] => {
  const {
    context, tiles,
  } = input;
  const {
    conditions, dora,
  } = context;
  const yaku: Yaku[] = [
  ];

  let omote = 0;
  for (const indicator of dora.indicators) {
    omote += countMatching(tiles,
      nextDoraTile(indicator));
  }
  if (omote > 0) {
    yaku.push({
      han: omote,
      name: 'ドラ',
    });
  }

  const aka = tiles.filter((tile) => {
    return isSuited(tile) && tile.isRedDora;
  }).length;
  if (aka > 0) {
    yaku.push({
      han: aka,
      name: '赤ドラ',
    });
  }

  if (conditions.riichi || conditions.doubleRiichi) {
    let ura = 0;
    for (const indicator of dora.uraIndicators) {
      ura += countMatching(tiles,
        nextDoraTile(indicator));
    }
    if (ura > 0) {
      yaku.push({
        han: ura,
        name: '裏ドラ',
      });
    }
  }

  return yaku;
};

// --- 役満 ---

const windTriplets = (decomposition: HandDecomposition): Mentsu[] => {
  return tripletsOf(decomposition).filter((meld) => {
    const head = meldHead(meld);
    return isHonor(head) && WIND_ORDER.includes(head.honor);
  });
};

const dragonTriplets = (decomposition: HandDecomposition): Mentsu[] => {
  return tripletsOf(decomposition).filter((meld) => {
    const head = meldHead(meld);
    return isHonor(head) && isDragon(head.honor);
  });
};

const isChuuren = (tiles: readonly Tile[], isMenzen: boolean): boolean => {
  if (!isMenzen) {
    return false;
  }
  const suited = tiles.filter(isSuited);
  if (suited.length !== 14) {
    return false;
  }
  const suits = new Set(suited.map((tile) => {
    return tile.suit;
  }));
  if (suits.size !== 1) {
    return false;
  }
  const counts = new Array<number>(9).fill(0);
  for (const tile of suited) {
    counts[tile.rank - 1] += 1;
  }
  const base = [
    3,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    3
  ];
  return base.every((minimum, index) => {
    return counts[index] >= minimum;
  });
};

const isRyuuiisou = (tiles: readonly Tile[]): boolean => {
  return tiles.every((tile) => {
    if (isHonor(tile)) {
      return tile.honor === 'green';
    }
    return tile.suit === 'sou' && [
      2,
      3,
      4,
      6,
      8
    ].includes(tile.rank);
  });
};

const detectYakuman = (input: YakuInput): string[] => {
  const {
    context, decomposition, isMenzen, tiles,
  } = input;
  const yakuman: string[] = [
  ];

  if (decomposition.form === 'kokushi') {
    yakuman.push('国士無双');
    return yakuman; // 国士は他の役満と複合しない。
  }

  if (countAnkou(decomposition,
    context) === 4) {
    yakuman.push('四暗刻');
  }
  if (dragonTriplets(decomposition).length === 3) {
    yakuman.push('大三元');
  }
  const winds = windTriplets(decomposition).length;
  const pair = pairOf(decomposition);
  const pairHead = pair === undefined ? null : meldHead(pair);
  const pairIsWind = pairHead !== null && isHonor(pairHead) && WIND_ORDER.includes(pairHead.honor);
  if (winds === 4) {
    yakuman.push('大四喜');
  }
  else if (winds === 3 && pairIsWind) {
    yakuman.push('小四喜');
  }
  if (tiles.every(isHonor)) {
    yakuman.push('字一色');
  }
  if (tiles.every(isTerminal)) {
    yakuman.push('清老頭');
  }
  if (isRyuuiisou(tiles)) {
    yakuman.push('緑一色');
  }
  if (decomposition.mentsu.filter((meld) => {
    return meld.type === 'kantsu';
  }).length === 4) {
    yakuman.push('四槓子');
  }
  if (isChuuren(tiles,
    isMenzen)) {
    yakuman.push('九蓮宝燈');
  }

  return yakuman;
};

export const isMenzenHand = (hand: Hand): boolean => {
  return hand.furo.every((furo) => {
    return furo.type === 'ankan';
  });
};

export const buildYakuInput = (
  hand: Hand,
  decomposition: HandDecomposition,
  context: WinningContext
): YakuInput => {
  const tiles = [
    ...hand.concealed,
    hand.winningTile,
    ...hand.furo.flatMap((furo) => {
      return furo.tiles;
    })
  ];
  return {
    context,
    decomposition,
    isMenzen: isMenzenHand(hand),
    tiles,
  };
};

export const judgeYaku = (input: YakuInput): YakuResult => {
  const yakuman = detectYakuman(input);
  if (yakuman.length > 0) {
    return {
      han: 0,
      yaku: [
      ],
      yakuman,
    };
  }

  const yaku: Yaku[] = [
    ...detectSituationYaku(input),
    ...detectYakuhai(input.decomposition,
      input.context)
  ];

  if (isTanyao(input.tiles)) {
    yaku.push({
      han: 1,
      name: '断么九',
    });
  }
  if (input.decomposition.form === 'sevenPairs') {
    yaku.push({
      han: 2,
      name: '七対子',
    });
  }
  if (input.decomposition.form === 'standard') {
    yaku.push(...detectStandardYaku(input));
  }
  if (isHonroutou(input.tiles)) {
    yaku.push({
      han: 2,
      name: '混老頭',
    });
  }
  const flush = detectFlush(input.tiles,
    input.isMenzen);
  if (flush !== null) {
    yaku.push(flush);
  }

  yaku.push(...detectDora(input));

  const han = yaku.reduce((sum, current) => {
    return sum + current.han;
  },
  0);

  return {
    han,
    yaku,
    yakuman: [
    ],
  };
};
