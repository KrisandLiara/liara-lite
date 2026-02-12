import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    topLevelAwait(),
    wasm(),
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkGfm],
        providerImportSource: "@mdx-js/react",
      }),
    },
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    hmr: {
      overlay: false,
    },
    watch: {
      ignored: ['**/import/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    historyApiFallback: {
      rewrites: [
        { from: /^\/app\/.*$/, to: '/index.html' },
      ],
    },
  },
});
