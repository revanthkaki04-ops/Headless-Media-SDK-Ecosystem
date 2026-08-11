import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'media-core': path.resolve(__dirname, '../../packages/media-core/src/index.ts'),
      'media-react': path.resolve(__dirname, '../../packages/media-react/src/index.tsx'),
      'media-ui-react': path.resolve(__dirname, '../../packages/media-ui-react/src/index.tsx'),
      '@media-sdk/core': path.resolve(__dirname, '../../packages/media-core/src/index.ts'),
      '@media-sdk/react': path.resolve(__dirname, '../../packages/media-react/src/index.tsx'),
      '@media-sdk/ui-react': path.resolve(__dirname, '../../packages/media-ui-react/src/index.tsx'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist'),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
