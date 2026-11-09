import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Crucial for Tizen TV widget packaging (relative file paths)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
  },
  server: {
    port: 3030,
    host: true,
  },
  // @ts-ignore vitest config
  test: {
    environment: 'happy-dom',
    globals: true,
  },
});
