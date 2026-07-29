import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * Where the built site will be served from.
 *
 * GitHub Pages serves a project site under /<repo>/, so its asset URLs need that
 * prefix. Vercel (and Netlify, and the dev server) serve from the domain root,
 * where the same prefix would 404 every asset. Both providers advertise
 * themselves in the environment, so this resolves itself rather than depending
 * on someone remembering to set a variable. VITE_BASE still wins if set.
 */
const resolveBase = () => {
  if (process.env.VITE_BASE) return process.env.VITE_BASE;
  if (process.env.VERCEL || process.env.NETLIFY) return '/';
  return '/monster-drink/';
};

export default defineConfig(({command}) => {
  return {
    // Only for `build` — applying it in dev would move the dev server off
    // localhost:5173/ for no reason.
    base: command === 'build' ? resolveBase() : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
