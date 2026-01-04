import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: '.',
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.preview.emergentagent.com',
      'font-manager-ui.preview.emergentagent.com'
    ]
  },
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
