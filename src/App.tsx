import React, {
  useCallback, useMemo, useState
} from 'react';

import {
  type Furo,
  type FuroType,
  type Hand,
  isSuited,
  type Tile,
  type Wind,
  type WinningConditions,
  type WinType
} from './domain/index.ts';
import {
  calculateHandScore, type HandScore
} from './engine/index.ts';
import {
  addTileToHand,
  ALL_TILES,
  buildFuro,
  HAND_SIZE,
  tileColorClass,
  tileFromKey,
  tileKey,
  tileLabel,
  toggleRedFive
} from './lib/tiles.ts';
import {
  type ScorePayments
} from './score/index.ts';

type RiichiState = 'double' | 'none' | 'riichi';

type FlagKey = 'chankan' | 'haitei' | 'houtei' | 'ippatsu' | 'rinshan';

type FlagState = Record<FlagKey, boolean>;

const NO_FLAGS: FlagState = {
  chankan: false,
  haitei: false,
  houtei: false,
  ippatsu: false,
  rinshan: false,
};

type FlagDef = {
  readonly key: FlagKey
  readonly label: string
  // 成立に必要な状況（riichi: 立直中 / tsumo: ツモ / ron: ロン）。
  readonly requires: 'riichi' | 'ron' | 'tsumo'
};

const FLAGS: readonly FlagDef[] = [
  {
    key: 'ippatsu',
    label: '一発',
    requires: 'riichi',
  },
  {
    key: 'haitei',
    label: '海底',
    requires: 'tsumo',
  },
  {
    key: 'houtei',
    label: '河底',
    requires: 'ron',
  },
  {
    key: 'rinshan',
    label: '嶺上',
    requires: 'tsumo',
  },
  {
    key: 'chankan',
    label: '槍槓',
    requires: 'ron',
  }
];

type FuroTypeOption = {
  readonly label: string
  readonly value: FuroType
};

const FURO_TYPES: readonly FuroTypeOption[] = [
  {
    label: 'ポン',
    value: 'pon',
  },
  {
    label: 'チー',
    value: 'chi',
  },
  {
    label: '暗槓',
    value: 'ankan',
  },
  {
    label: '大明槓',
    value: 'daiminkan',
  },
  {
    label: '加槓',
    value: 'kakan',
  }
];

type WindOption = {
  readonly label: string
  readonly value: Wind
};

const WINDS: readonly WindOption[] = [
  {
    label: '東',
    value: 'east',
  },
  {
    label: '南',
    value: 'south',
  },
  {
    label: '西',
    value: 'west',
  },
  {
    label: '北',
    value: 'north',
  }
];

// 麻雀牌らしい見た目（白い牌・角丸・影）。
const tileFaceClass = 'inline-flex h-11 w-9 items-center justify-center rounded-md border '
  + 'border-stone-300 bg-white text-lg font-bold shadow-sm';

const sectionClass = 'space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm';

const selectClass = 'rounded-md border border-stone-300 bg-white px-2 py-1';

const MAX_DORA = 5; // ドラ表示牌は最大5枚（4カン + 1）。

const paymentsText = (payments: ScorePayments): string => {
  if (payments.kind === 'ron') {
    return `放銃者の支払い ${payments.fromDiscarder} 点`;
  }
  if (payments.fromDealer === null) {
    return `子それぞれ ${payments.fromNonDealer} 点（オール）`;
  }
  return `親 ${payments.fromDealer} 点 / 子 ${payments.fromNonDealer} 点`;
};

const App = (): React.ReactNode => {
  const [
    handTiles,
    setHandTiles
  ] = useState<Tile[]>([
  ]);
  const [
    winningIndex,
    setWinningIndex
  ] = useState<null | number>(null);
  const [
    winType,
    setWinType
  ] = useState<WinType>('ron');
  const [
    roundWind,
    setRoundWind
  ] = useState<Wind>('east');
  const [
    seatWind,
    setSeatWind
  ] = useState<Wind>('east');
  const [
    riichiState,
    setRiichiState
  ] = useState<RiichiState>('none');
  const [
    flags,
    setFlags
  ] = useState<FlagState>(NO_FLAGS);
  const [
    doraIndicators,
    setDoraIndicators
  ] = useState<Tile[]>([
  ]);
  const [
    uraIndicators,
    setUraIndicators
  ] = useState<Tile[]>([
  ]);
  const [
    furos,
    setFuros
  ] = useState<Furo[]>([
  ]);
  const [
    furoType,
    setFuroType
  ] = useState<FuroType>('pon');
  const [
    furoBaseKey,
    setFuroBaseKey
  ] = useState<string>('man-1');

  const handlePick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const tile = tileFromKey(event.currentTarget.dataset.tile ?? '');
    if (tile === undefined) {
      return;
    }
    setHandTiles((prev) => {
      return addTileToHand(prev,
        tile);
    });
  },
  [
  ]);

  const handleRemove = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const index = Number(event.currentTarget.dataset.index);
    setHandTiles((prev) => {
      return prev.filter((_, i) => {
        return i !== index;
      });
    });
    setWinningIndex(null);
  },
  [
  ]);

  const handleSetWinning = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setWinningIndex(Number(event.currentTarget.dataset.index));
  },
  [
  ]);

  const handleClear = useCallback(() => {
    setHandTiles([
    ]);
    setWinningIndex(null);
  },
  [
  ]);

  const handleWinType = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setWinType(event.target.value as WinType);
  },
  [
  ]);

  const handleRoundWind = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setRoundWind(event.target.value as Wind);
  },
  [
  ]);

  const handleSeatWind = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSeatWind(event.target.value as Wind);
  },
  [
  ]);

  const handleRiichiState = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setRiichiState(event.target.value as RiichiState);
  },
  [
  ]);

  const handleFlag = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const flag = event.currentTarget.dataset.flag as FlagKey | undefined;
    if (flag === undefined) {
      return;
    }
    const {
      checked,
    } = event.currentTarget;
    setFlags((prev) => {
      return {
        ...prev,
        [flag]: checked,
      };
    });
  },
  [
  ]);

  // 手牌の5を赤ドラに切り替える（同色の赤5は1枚まで）。
  const handleToggleRed = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const index = Number(event.currentTarget.dataset.index);
    setHandTiles((prev) => {
      return toggleRedFive(prev,
        index);
    });
  },
  [
  ]);

  const handleAddDora = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const tile = tileFromKey(event.target.value);
    if (tile === undefined) {
      return;
    }
    setDoraIndicators((prev) => {
      return prev.length >= MAX_DORA
        ? prev
        : [
            ...prev,
            tile
          ];
    });
  },
  [
  ]);

  const handleRemoveDora = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const index = Number(event.currentTarget.dataset.index);
    setDoraIndicators((prev) => {
      return prev.filter((_, i) => {
        return i !== index;
      });
    });
  },
  [
  ]);

  const handleAddUra = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const tile = tileFromKey(event.target.value);
    if (tile === undefined) {
      return;
    }
    setUraIndicators((prev) => {
      return prev.length >= MAX_DORA
        ? prev
        : [
            ...prev,
            tile
          ];
    });
  },
  [
  ]);

  const handleRemoveUra = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const index = Number(event.currentTarget.dataset.index);
    setUraIndicators((prev) => {
      return prev.filter((_, i) => {
        return i !== index;
      });
    });
  },
  [
  ]);

  const handleFuroType = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setFuroType(event.target.value as FuroType);
  },
  [
  ]);

  const handleFuroBase = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setFuroBaseKey(event.target.value);
  },
  [
  ]);

  const handleAddFuro = useCallback(() => {
    const base = tileFromKey(furoBaseKey);
    if (base === undefined) {
      return;
    }
    const furo = buildFuro(furoType,
      base);
    if (furo === null) {
      return; // チーで不正な牌など。
    }
    setFuros((prev) => {
      return prev.length >= 4
        ? prev
        : [
            ...prev,
            furo
          ];
    });
  },
  [
    furoBaseKey,
    furoType
  ]);

  const handleRemoveFuro = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const index = Number(event.currentTarget.dataset.index);
    setFuros((prev) => {
      return prev.filter((_, i) => {
        return i !== index;
      });
    });
  },
  [
  ]);

  // ピッカーの4枚上限は手牌＋副露の合計で判定する。
  const tileCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const countTile = (tile: Tile): void => {
      const key = tileKey(tile);
      counts.set(key,
        (counts.get(key) ?? 0) + 1);
    };
    for (const tile of handTiles) {
      countTile(tile);
    }
    for (const furo of furos) {
      for (const tile of furo.tiles) {
        countTile(tile);
      }
    }
    return counts;
  },
  [
    handTiles,
    furos
  ]);

  // 必要な手牌枚数（副露1組につき3枚減る）。
  const requiredHandTiles = HAND_SIZE - 3 * furos.length;
  const isHandFull = handTiles.length >= requiredHandTiles;

  const effectiveWinning = winningIndex ?? handTiles.length - 1;

  const score = useMemo<HandScore | null | undefined>(() => {
    if (handTiles.length !== requiredHandTiles) {
      return undefined;
    }
    if (effectiveWinning < 0 || effectiveWinning >= handTiles.length) {
      return undefined;
    }
    const winningTile = handTiles[effectiveWinning];
    const concealed = handTiles.filter((_, i) => {
      return i !== effectiveWinning;
    });
    const hand: Hand = {
      concealed,
      furo: furos,
      winningTile,
    };
    // 状況役は和了種別・立直状態と矛盾しないように整える（エンジンも同様にガード）。
    const conditions: WinningConditions = {
      chankan: flags.chankan && winType === 'ron',
      doubleRiichi: riichiState === 'double',
      haitei: flags.haitei && winType === 'tsumo',
      houtei: flags.houtei && winType === 'ron',
      ippatsu: flags.ippatsu && riichiState !== 'none',
      riichi: riichiState === 'riichi',
      rinshan: flags.rinshan && winType === 'tsumo',
    };
    return calculateHandScore(hand,
      {
        conditions,
        dora: {
          indicators: doraIndicators,
          uraIndicators,
        },
        roundWind,
        seatWind,
        winType,
      });
  },
  [
    handTiles,
    requiredHandTiles,
    effectiveWinning,
    riichiState,
    flags,
    roundWind,
    seatWind,
    winType,
    doraIndicators,
    uraIndicators,
    furos
  ]);

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="mx-auto max-w-3xl space-y-5 p-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-stone-800">
            麻雀点数計算ツール
          </h1>
          <p className="text-sm text-stone-500">
            手牌・条件・ドラを選ぶと点数を計算します。
          </p>
        </header>

        <section className={sectionClass}>
          <h2 className="font-semibold">
            牌を選ぶ（
            {handTiles.length}
            /
            {requiredHandTiles}
            ）
          </h2>
          <div className="flex flex-wrap gap-1">
            {ALL_TILES.map((tile) => {
              const key = tileKey(tile);
              const disabled = isHandFull || (tileCounts.get(key) ?? 0) >= 4;
              return (
                <button
                  className={`${tileFaceClass} ${tileColorClass(tile)} `
                  + `${disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-amber-50 active:bg-amber-100'}`}
                  data-tile={key}
                  disabled={disabled}
                  key={key}
                  onClick={handlePick}
                  type="button"
                >
                  {tileLabel(tile)}
                </button>
              );
            })}
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="font-semibold">
            手牌（クリックでアガリ牌に指定 / ×で削除）
          </h2>
          {handTiles.length === 0
            ? (
                <p className="text-stone-500">
                  牌を選んでください。
                </p>
              )
            : (
                <div className="flex flex-wrap gap-1">
                  {handTiles.map((tile, index) => {
                    const isWinning = index === effectiveWinning;
                    const canBeRed = isSuited(tile) && tile.rank === 5;
                    const isRed = isSuited(tile) && tile.isRedDora;
                    const ringClass = isWinning ? ' ring-2 ring-rose-500 ring-offset-1' : '';
                    return (
                      <span
                        className="inline-flex flex-col items-center"
                        key={`${tileKey(tile)}-${index}`}
                      >
                        <button
                          className={`${tileFaceClass} ${tileColorClass(tile)}${ringClass}`}
                          data-index={index}
                          onClick={handleSetWinning}
                          title="クリックでアガリ牌に指定"
                          type="button"
                        >
                          {tileLabel(tile)}
                        </button>
                        <span className="mt-0.5 flex items-center gap-1 text-xs">
                          {isWinning
                            ? (
                                <span className="text-rose-500">
                                  和
                                </span>
                              )
                            : null}
                          {canBeRed
                            ? (
                                <button
                                  className={isRed ? 'font-bold text-red-600' : 'text-stone-400'}
                                  data-index={index}
                                  onClick={handleToggleRed}
                                  type="button"
                                >
                                  赤
                                </button>
                              )
                            : null}
                          <button
                            className="text-stone-400 hover:text-rose-500"
                            data-index={index}
                            onClick={handleRemove}
                            type="button"
                          >
                            ×
                          </button>
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
          <button
            className="rounded border border-stone-300 px-3 py-1 text-sm hover:bg-stone-100"
            onClick={handleClear}
            type="button"
          >
            クリア
          </button>
        </section>

        <section className={sectionClass}>
          <h2 className="font-semibold">
            副露（鳴き）
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={selectClass}
              onChange={handleFuroType}
              value={furoType}
            >
              {FURO_TYPES.map((furoOption) => {
                return (
                  <option key={furoOption.value} value={furoOption.value}>
                    {furoOption.label}
                  </option>
                );
              })}
            </select>
            <select
              className={selectClass}
              onChange={handleFuroBase}
              value={furoBaseKey}
            >
              {ALL_TILES.map((tile) => {
                const key = tileKey(tile);
                return (
                  <option key={key} value={key}>
                    {tileLabel(tile)}
                  </option>
                );
              })}
            </select>
            <button
              className="rounded border border-stone-300 px-3 py-1 text-sm hover:bg-stone-100"
              disabled={furos.length >= 4}
              onClick={handleAddFuro}
              type="button"
            >
              追加
            </button>
          </div>
          {furos.length === 0
            ? (
                <p className="text-stone-500">
                  なし（チーは1〜7の数牌のみ）
                </p>
              )
            : (
                <div className="flex flex-wrap gap-2">
                  {furos.map((furo, index) => {
                    return (
                      <span
                        className="inline-flex items-center rounded border border-stone-300 px-1"
                        key={`${furo.type}-${tileKey(furo.tiles[0])}-${index}`}
                      >
                        <span className="flex px-1 font-bold">
                          {furo.tiles.map((tile, tileIndex) => {
                            return (
                              <span
                                className={`px-0.5 ${tileColorClass(tile)}`}
                                key={`${tileKey(tile)}-${tileIndex}`}
                              >
                                {tileLabel(tile)}
                              </span>
                            );
                          })}
                        </span>
                        <button
                          className="px-1 text-stone-400 hover:text-rose-500"
                          data-index={index}
                          onClick={handleRemoveFuro}
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
        </section>

        <section className={sectionClass}>
          <h2 className="font-semibold">
            和了条件
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1">
              和了
              <select
                className={selectClass}
                onChange={handleWinType}
                value={winType}
              >
                <option value="ron">
                  ロン
                </option>
                <option value="tsumo">
                  ツモ
                </option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              場風
              <select
                className={selectClass}
                onChange={handleRoundWind}
                value={roundWind}
              >
                {WINDS.map((wind) => {
                  return (
                    <option key={wind.value} value={wind.value}>
                      {wind.label}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="flex items-center gap-1">
              自風
              <select
                className={selectClass}
                onChange={handleSeatWind}
                value={seatWind}
              >
                {WINDS.map((wind) => {
                  return (
                    <option key={wind.value} value={wind.value}>
                      {wind.label}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="flex items-center gap-1">
              立直
              <select
                className={selectClass}
                onChange={handleRiichiState}
                value={riichiState}
              >
                <option value="none">
                  なし
                </option>
                <option value="riichi">
                  リーチ
                </option>
                <option value="double">
                  ダブリー
                </option>
              </select>
            </label>
            {FLAGS.map((flag) => {
              const disabled = (flag.requires === 'riichi' && riichiState === 'none')
                || (flag.requires === 'tsumo' && winType !== 'tsumo')
                || (flag.requires === 'ron' && winType !== 'ron');
              return (
                <label
                  className={`flex items-center gap-1 ${disabled ? 'text-stone-400' : ''}`}
                  key={flag.key}
                >
                  <input
                    checked={flags[flag.key]}
                    data-flag={flag.key}
                    disabled={disabled}
                    onChange={handleFlag}
                    type="checkbox"
                  />
                  {flag.label}
                </label>
              );
            })}
          </div>
        </section>

        <IndicatorRow
          indicators={doraIndicators}
          onAdd={handleAddDora}
          onRemove={handleRemoveDora}
          title="ドラ表示牌（次の牌がドラ）"
        />
        {riichiState !== 'none'
          ? (
              <IndicatorRow
                indicators={uraIndicators}
                onAdd={handleAddUra}
                onRemove={handleRemoveUra}
                title="裏ドラ表示牌"
              />
            )
          : null}

        <section className={sectionClass}>
          <h2 className="font-semibold">
            結果
          </h2>
          <ScoreView
            handCount={handTiles.length}
            requiredHandTiles={requiredHandTiles}
            score={score}
          />
        </section>
      </div>
    </div>
  );
};

type IndicatorRowProps = {
  readonly indicators: readonly Tile[]
  readonly onAdd: (event: React.ChangeEvent<HTMLSelectElement>) => void
  readonly onRemove: (event: React.MouseEvent<HTMLButtonElement>) => void
  readonly title: string
};

const IndicatorRow = ({
  indicators, onAdd, onRemove, title,
}: IndicatorRowProps): React.ReactNode => {
  return (
    <section className={sectionClass}>
      <h2 className="font-semibold">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={selectClass}
          onChange={onAdd}
          value=""
        >
          <option value="">
            ＋ 追加
          </option>
          {ALL_TILES.map((tile) => {
            const key = tileKey(tile);
            return (
              <option key={key} value={key}>
                {tileLabel(tile)}
              </option>
            );
          })}
        </select>
        {indicators.length === 0
          ? (
              <span className="text-stone-500">
                なし
              </span>
            )
          : (
              <div className="flex flex-wrap gap-1">
                {indicators.map((tile, index) => {
                  return (
                    <span
                      className="inline-flex items-center"
                      key={`${tileKey(tile)}-${index}`}
                    >
                      <span className={`${tileFaceClass} ${tileColorClass(tile)}`}>
                        {tileLabel(tile)}
                      </span>
                      <button
                        className="px-1 text-stone-400 hover:text-rose-500"
                        data-index={index}
                        onClick={onRemove}
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
      </div>
    </section>
  );
};

type ScoreViewProps = {
  readonly handCount: number
  readonly requiredHandTiles: number
  readonly score: HandScore | null | undefined
};

const ScoreView = ({
  handCount, requiredHandTiles, score,
}: ScoreViewProps): React.ReactNode => {
  if (score === undefined) {
    const shortage = requiredHandTiles - handCount;
    const message = shortage > 0
      ? `あと ${shortage} 枚選んでください（${handCount}/${requiredHandTiles}）`
      : `手牌が ${-shortage} 枚多いです（${handCount}/${requiredHandTiles}）`;
    return (
      <p className="text-stone-500">
        {message}
      </p>
    );
  }
  if (score === null) {
    return (
      <p className="text-rose-600">
        役なし、または和了形ではありません。
      </p>
    );
  }
  const isYakuman = score.yakuman.length > 0;
  const detail = isYakuman ? '役満' : `${score.han} 翻 ${score.fu} 符`;
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-emerald-700">
          {score.total}
        </span>
        <span className="text-lg text-stone-600">
          点
        </span>
        <span className={`text-sm ${isYakuman ? 'font-semibold text-amber-700' : 'text-stone-500'}`}>
          {detail}
        </span>
      </div>
      <p className="text-sm text-stone-600">
        {paymentsText(score.payments)}
      </p>
      <div className="flex flex-wrap gap-1">
        {isYakuman
          ? score.yakuman.map((name, index) => {
            return (
              <span
                className="rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-800"
                key={`${name}-${index}`}
              >
                {name}
              </span>
            );
          })
          : score.yaku.map((yaku, index) => {
            return (
              <span
                className="rounded-full bg-stone-100 px-2 py-0.5 text-sm"
                key={`${yaku.name}-${index}`}
              >
                {yaku.name}
                {' '}
                {yaku.han}
                翻
              </span>
            );
          })}
      </div>
    </div>
  );
};

export default App;
