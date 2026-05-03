import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Proxies /anthropic-api/* → api.anthropic.com, injecting the API key server-side
function anthropicProxyPlugin(apiKey) {
  return {
    name: 'anthropic-proxy',
    configureServer(server) {
      server.middlewares.use('/anthropic-api', (req, res) => {
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          const body = Buffer.concat(chunks)
          const targetUrl = `https://api.anthropic.com${req.url}`
          try {
            const upstream = await fetch(targetUrl, {
              method: req.method,
              headers: {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: body.length > 0 ? body : undefined,
            })
            const text = await upstream.text()
            res.writeHead(upstream.status, { 'content-type': 'application/json' })
            res.end(text)
          } catch (err) {
            res.writeHead(502, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ error: { message: err.message } }))
          }
        })
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const anthropicKey = env.ANTHROPIC_API_KEY || ''

  return {
    plugins: [react(), anthropicProxyPlugin(anthropicKey)],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8100',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/cc-application-service/1.0')
        }
      }
    }
  }
})
