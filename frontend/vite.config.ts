import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET

  if (command === 'serve' && !proxyTarget) {
    throw new Error('VITE_DEV_PROXY_TARGET is not set. Add it to frontend/.env')
  }

  return {
    plugins: [react()],
    server:
      command === 'serve'
        ? {
            port: 5173,
            proxy: {
              '/api': {
                target: proxyTarget,
                changeOrigin: true,
              },
            },
          }
        : undefined,
  }
})
