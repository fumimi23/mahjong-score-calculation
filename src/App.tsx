import React, {
  useCallback, useMemo, useState
} from 'react';

import {
  type Hand,
  type Tile,
  type Wind,
  type WinningConditions,
  type WinType
} from './domain/index.ts';
import {
  calculateHandScore, type HandScore
} from './engine/index.ts';
import {
  ALL_TILES, tileFromKey, tileKey, tileLabel
} from './lib/tiles.ts';

const HAND_SIZE = 14;

const NO_CONDITIONS: WinningConditions = {
  chankan: false,
  doubleRiichi: false,
  haitei: false,
  houtei: false,
  ippatsu: false,
  riichi: false,
  rinshan: false,
};

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

const tileButtonClass = 'min-w-9 rounded border border-stone-300 bg-white px-2 py-1 '
  + 'text-lg hover:bg-amber-100 active:bg-amber-200';

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
    riichi,
    setRiichi
  ] = useState(false);

  const handlePick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const tile = tileFromKey(event.currentTarget.dataset.tile ?? '');
    if (tile === undefined) {
      return;
    }
    setHandTiles((prev) => {
      return prev.length >= HAND_SIZE
        ? prev
        : [
            ...prev,
            tile
          ];
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

  const handleRiichi = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRiichi(event.target.checked);
  },
  [
  ]);

  const effectiveWinning = winningIndex ?? handTiles.length - 1;

  const score = useMemo<HandScore | null | undefined>(() => {
    if (handTiles.length !== HAND_SIZE) {
      return undefined;
    }
    if (effectiveWinning < 0 || effectiveWinning >= HAND_SIZE) {
      return undefined;
    }
    const winningTile = handTiles[effectiveWinning];
    const concealed = handTiles.filter((_, i) => {
      return i !== effectiveWinning;
    });
    const hand: Hand = {
      concealed,
      furo: [
      ],
      winningTile,
    };
    return calculateHandScore(hand,
      {
        conditions: {
          ...NO_CONDITIONS,
          riichi,
        },
        dora: {
          indicators: [
          ],
          uraIndicators: [
          ],
        },
        roundWind,
        seatWind,
        winType,
      });
  },
  [
    handTiles,
    effectiveWinning,
    riichi,
    roundWind,
    seatWind,
    winType
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">
        麻雀点数計算ツール
      </h1>

      <section className="space-y-2">
        <h2 className="font-semibold">
          牌を選ぶ（
          {handTiles.length}
          /
          {HAND_SIZE}
          ）
        </h2>
        <div className="flex flex-wrap gap-1">
          {ALL_TILES.map((tile) => {
            return (
              <button
                className={tileButtonClass}
                data-tile={tileKey(tile)}
                key={tileKey(tile)}
                onClick={handlePick}
                type="button"
              >
                {tileLabel(tile)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
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
                  return (
                    <span
                      className="inline-flex items-center"
                      key={`${tileKey(tile)}-${index}`}
                    >
                      <button
                        className={`${tileButtonClass} ${isWinning ? 'ring-2 ring-rose-400' : ''}`}
                        data-index={index}
                        onClick={handleSetWinning}
                        type="button"
                      >
                        {tileLabel(tile)}
                      </button>
                      <button
                        className="px-1 text-stone-400 hover:text-rose-500"
                        data-index={index}
                        onClick={handleRemove}
                        type="button"
                      >
                        ×
                      </button>
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

      <section className="flex flex-wrap gap-4">
        <label className="flex items-center gap-1">
          和了
          <select
            className="rounded border border-stone-300 px-2 py-1"
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
            className="rounded border border-stone-300 px-2 py-1"
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
            className="rounded border border-stone-300 px-2 py-1"
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
          <input
            checked={riichi}
            onChange={handleRiichi}
            type="checkbox"
          />
          リーチ
        </label>
      </section>

      <section className="rounded border border-stone-300 p-4">
        <h2 className="mb-2 font-semibold">
          結果
        </h2>
        <ScoreView score={score} />
      </section>
    </div>
  );
};

type ScoreViewProps = {
  readonly score: HandScore | null | undefined
};

const ScoreView = ({
  score,
}: ScoreViewProps): React.ReactNode => {
  if (score === undefined) {
    return (
      <p className="text-stone-500">
        14 枚そろえると点数を表示します。
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
  return (
    <div className="space-y-2">
      <p className="text-3xl font-bold">
        {score.total}
        点
      </p>
      {isYakuman
        ? (
            <p className="font-semibold text-amber-700">
              役満：
              {score.yakuman.join('・')}
            </p>
          )
        : (
            <>
              <p>
                {score.han}
                翻
                {' '}
                {score.fu}
                符
              </p>
              <ul className="list-inside list-disc text-sm">
                {score.yaku.map((yaku) => {
                  return (
                    <li key={yaku.name}>
                      {yaku.name}
                      {' '}
                      {yaku.han}
                      翻
                    </li>
                  );
                })}
              </ul>
            </>
          )}
    </div>
  );
};

export default App;
