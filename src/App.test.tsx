import {
  renderToStaticMarkup
} from 'react-dom/server';
import {
  describe, expect, it
} from 'vitest';

import App from './App.tsx';

// ヘッドレスブラウザが無い環境向けの描画スモークテスト。
// App が例外なく初期描画でき、主要要素が含まれることを確認する（操作の検証はブラウザで）。
describe('App',
  () => {
    it('クラッシュせず初期表示する',
      () => {
        const html = renderToStaticMarkup(<App />);
        expect(html).toContain('麻雀点数計算ツール');
        expect(html).toContain('5萬');
        expect(html).toContain('東');
        expect(html).toContain('牌を選んでください');
        expect(html).toContain('一発');
        expect(html).toContain('海底');
        expect(html).toContain('鳴きを追加');
        expect(html).toContain('和了条件');
        expect(html).toContain('ドラ表示牌（次の牌がドラ）');
        expect(html).toContain('あと 14 枚選んでください');
      });
  });
