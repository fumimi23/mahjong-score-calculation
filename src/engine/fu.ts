// 符計算 [#22]
//
// 1つの面子分解 + 和了条件から符を算出する。
// 副底20 + 門前ロン10 + ツモ2（平和ツモ除く） + 待ち + 雀頭 + 面子の符 → 10符単位で切り上げ。
// 平和ロン=30 / 平和ツモ=20、七対子=25、喰い平和形（鳴き平和形のロン）=30。

import {
  type HandDecomposition
} from '../decomposition/index.ts';
import {
  type Honor,
  isHonor,
  isSuited,
  type Mentsu,
  type Tile,
  type WinningContext
} from '../domain/index.ts';

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

// 刻子・槓子の符。順子・雀頭は 0（雀頭の役牌符は別途加算）。
const meldFu = (meld: Mentsu, isOpenForFu: boolean): number => {
  const yaochu = isYaochu(meld.tiles[0]);
  if (meld.type === 'kotsu') {
    if (yaochu) {
      return isOpenForFu ? 4 : 8;
    }
    return isOpenForFu ? 2 : 4;
  }
  if (meld.type === 'kantsu') {
    if (yaochu) {
      return isOpenForFu ? 16 : 32;
    }
    return isOpenForFu ? 8 : 16;
  }
  return 0;
};

export const calculateFu = (
  decomposition: HandDecomposition,
  context: WinningContext,
  isMenzen: boolean,
  isPinfu: boolean
): number => {
  if (decomposition.form === 'sevenPairs') {
    return 25;
  }
  if (decomposition.form === 'kokushi') {
    return 0; // 役満は符を使わない（点数化は別経路）。
  }

  let fu = 20; // 副底
  if (isMenzen && context.winType === 'ron') {
    fu += 10;
  }
  if (context.winType === 'tsumo' && !isPinfu) {
    fu += 2;
  }
  if (decomposition.wait === 'kanchan' || decomposition.wait === 'penchan' || decomposition.wait === 'tanki') {
    fu += 2;
  }

  // 役牌雀頭は +2。連風牌（自風かつ場風）も +2 とする（天鳳/M-League 準拠。+4 を採るルールもある）。
  const pair = decomposition.mentsu.find((meld) => {
    return meld.type === 'pair';
  });
  if (pair !== undefined && isYakuhaiTile(pair.tiles[0],
    context)) {
    fu += 2;
  }

  decomposition.mentsu.forEach((meld, index) => {
    // ロンで完成した刻子（双碰）は明刻として扱う。
    const isRonCompleted = context.winType === 'ron'
      && index === decomposition.winningMentsuIndex
      && meld.type === 'kotsu';
    fu += meldFu(meld,
      meld.isOpen || isRonCompleted);
  });

  // 喰い平和形（鳴きで全順子・両面・非役牌雀頭になりロンで20符）は30符に繰り上げる。
  if (!isPinfu && fu === 20) {
    fu = 30;
  }

  return Math.ceil(fu / 10) * 10;
};
