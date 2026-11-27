import { createAiPipelineApp } from './app.js'
import { loadEnv } from './config/env.js'

const env = loadEnv()
const app = createAiPipelineApp(env)

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[lifequest-ai-pipeline] running on port ${env.port} (llm=${env.aiApiKey ? env.aiModel : 'deterministic-fallback'})`
  )
})

const shutdown = (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`[lifequest-ai-pipeline] received ${signal}, shutting down...`)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
