import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'node-fetch': path.resolve(__dirname, 'src/fetch-mock.js'),
        'formdata-polyfill': path.resolve(__dirname, 'src/fetch-mock.js'),
        'formdata-polyfill/FormData': path.resolve(__dirname, 'src/fetch-mock.js'),
        'formdata-polyfill/FormData.js': path.resolve(__dirname, 'src/fetch-mock.js'),
        'whatwg-fetch': path.resolve(__dirname, 'src/fetch-mock.js'),
        'fetch-blob': path.resolve(__dirname, 'src/fetch-mock.js'),
        'data-uri-to-buffer': path.resolve(__dirname, 'src/fetch-mock.js'),
      },
    },
    build: {
      cssCodeSplit: false,
      assetsInlineLimit: 100000000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
