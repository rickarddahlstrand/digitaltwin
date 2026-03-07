import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

let gitHash = process.env.VITE_GIT_HASH || 'unknown'
if (gitHash === 'unknown') {
  try { gitHash = execSync('git rev-parse --short HEAD').toString().trim() } catch { /* */ }
}
const buildTime = process.env.VITE_BUILD_TIME || new Date().toISOString()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:8090', changeOrigin: true },
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
