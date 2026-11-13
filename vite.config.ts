import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// The Arc Studio preview proxy re-serialises query strings, turning `?raw` into
// `?raw=`, which Vite's built-in raw loader does not match. Accept both forms.
function markdownRaw(): Plugin {
  return {
    name: 'markdown-raw',
    enforce: 'pre',
    load(id) {
      const [file, query = ''] = id.split('?')
      if (!file.endsWith('.md') || !/(^|&)raw(=|&|$)/.test(query)) return null
      this.addWatchFile(file)
      return `export default ${JSON.stringify(readFileSync(file, 'utf-8'))}`
    },
  }
}

export default defineConfig({
  plugins: [markdownRaw(), react(), nodePolyfills()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      '@tanstack/react-query',
      'wagmi',
      'wagmi/chains',
      'wagmi/connectors',
      'viem',
      'viem/chains',
      'connectkit',
      'framer-motion',
      'lucide-react',
      'sonner',
      'clsx',
      'tailwind-merge',
      'vite-plugin-node-polyfills/shims/buffer',
      'vite-plugin-node-polyfills/shims/global',
      'vite-plugin-node-polyfills/shims/process',
    ],
  },
  server: {
    allowedHosts: true,
    cors: true,
    fs: {
      // Replaces Vite's defaults, so they are repeated. Internal docs must not be served by URL.
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/docs/internal/**', '**/docs/README.md'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
