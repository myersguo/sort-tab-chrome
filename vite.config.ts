// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'


export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src", "popup", "index.html"),
        options: resolve(__dirname, "src", "options", "index.html"),
        background: resolve(__dirname, "src", "background.ts"),
      },
      output: {
        entryFileNames: "src/[name]/index.js",
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
