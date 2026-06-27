import { defineConfig } from 'vitest/config';

// テスト設定。tsc のビルド対象（tsconfig.app/node）に含めないことで、
// vitest 同梱の型定義とルートの型定義の衝突をビルド時に避ける。
export default defineConfig({
  test: {
    include: [
      'src/**/*.test.ts'
    ],
  },
});