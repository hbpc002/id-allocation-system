import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.{test,spec}.{ts,tsx}', '**/*.test.{ts,tsx}'],
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/app': path.resolve(__dirname, './app'),
      '@/test': path.resolve(__dirname, './test')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        '@/app': path.resolve(__dirname, './app'),
        '@/test': path.resolve(__dirname, './test')
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.{ts,js,mjs}',
        '.next/',
        'next.config.ts'
      ]
    }
  },
  // Enable ESM mode for TypeScript files
  optimizeDeps: {
    disabled: true
  }
});
