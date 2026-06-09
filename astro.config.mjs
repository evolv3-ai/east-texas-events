import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://events.shallowcreek.com',
  outDir: process.env.ASTRO_OUT_DIR ?? './dist',
  vite: {
    cacheDir: process.env.VITE_CACHE_DIR ?? '/tmp/east-texas-events-vite-cache',
  },
});
