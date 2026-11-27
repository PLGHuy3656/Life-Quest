import 'dotenv/config'

export interface AiPipelineEnv {
  port: number
  serviceKey: string
  aiApiKey: string
  aiModel: string
  aiTimeoutMs: number
  enableTonePolish: boolean
  allowedOrigins: string[]
}

export function loadEnv(overrides: Partial<NodeJS.ProcessEnv> = {}): AiPipelineEnv {
  const source = { ...process.env, ...overrides }
  const port = Number(source.AI_PIPELINE_PORT || 8001)
  const aiTimeoutMs = Number(source.AI_TIMEOUT_MS || 12000)
  const rawOrigins = source.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000'

  return {
    port: Number.isFinite(port) && port > 0 ? port : 8001,
    serviceKey: (source.AI_PIPELINE_SERVICE_KEY || '').trim(),
    aiApiKey: (source.AI_API_KEY || '').trim(),
    aiModel: (source.AI_MODEL || 'gemini-2.5-flash').trim(),
    aiTimeoutMs: Number.isFinite(aiTimeoutMs) && aiTimeoutMs >= 1000 ? aiTimeoutMs : 12000,
    enableTonePolish: String(source.AI_ENABLE_TONE_POLISH || 'false').toLowerCase() === 'true',
    allowedOrigins: rawOrigins
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
}
