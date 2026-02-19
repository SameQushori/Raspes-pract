// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  esbuild: {
    jsx: 'automatic', // React 17+ new JSX transform
  },

  server: {
    proxy: {
      // Все запросы /ukrtb-api/* → https://study.ukrtb.ru/*
      '/ukrtb-api': {
        target:       'https://study.ukrtb.ru',
        changeOrigin: true,
        secure:       true,
        // Убираем префикс /ukrtb-api из пути
        rewrite:      path => path.replace(/^\/ukrtb-api/, ''),
        // Логирование прокси запросов (убрать в prod)
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[proxy] ${req.method} ${req.url}`)
          })
          proxy.on('error', (err, req, res) => {
            console.error('[proxy] error', err.message)
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }))
          })
        },
      },
    },
  },
})
