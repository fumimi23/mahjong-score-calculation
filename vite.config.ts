import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages（プロジェクトページ）のサブパス配下でも動くよう相対パスにする。
  base: './',
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(
        __dirname,
        './src'
      ),
    },
  },
});
