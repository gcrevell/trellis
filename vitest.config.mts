import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    server: {
      deps: {
        inline: ['zustand'],
      },
    },
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
      store: '/src/store.ts',
      types: '/src/types.ts',
      hooks: '/src/hooks/index.ts',
    },
  },
});
