import { loadEnv, type AiPipelineEnv } from '../config/env.js'
import type { TokenUsage } from '../domain/types.js'

export interface GeminiInlineImage {
  mimeType: string
  dataBase64: string
}

export interface GeminiStructuredParams {
  prompt: string
  systemInstruction: string
  responseSchema: Record<string, unknown>
  inlineImages?: GeminiInlineImage[]
  temperature?: number
  env?: AiPipelineEnv
  fetchImpl?: typeof fetch
}

export type GeminiStructuredResult<T> =
  | {
      ok: true
      data: T
      model: string
      tokenUsage?: TokenUsage
    }
  | {
      ok: false
      reason: string
    }

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
}

export async function callGeminiStructured<T>(
  params: GeminiStructuredParams
): Promise<GeminiStructuredResult<T>> {
  const env = params.env ?? loadEnv()
  const fetchFn = params.fetchImpl ?? globalThis.fetch

  if (!env.aiApiKey) {
    return { ok: false, reason: 'MISSING_API_KEY' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), env.aiTimeoutMs)

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      env.aiModel
    )}:generateContent?key=${encodeURIComponent(env.aiApiKey)}`

    const userParts: Array<
      | { text: string }
      | { inline_data: { mime_type: string; data: string } }
    > = [{ text: params.prompt }]

    if (params.inlineImages && params.inlineImages.length > 0) {
      for (const img of params.inlineImages) {
        userParts.push({
          inline_data: {
            mime_type: img.mimeType,
            data: img.dataBase64
          }
        })
      }
    }

    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: params.systemInstruction }]
        },
        contents: [
          {
            role: 'user',
            parts: userParts
          }
        ],
        generationConfig: {
          temperature: params.temperature ?? 0.35,
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema
        }
      })
    })

    if (!response.ok) {
      return { ok: false, reason: `GEMINI_HTTP_${response.status}` }
    }

    const body = (await response.json()) as GeminiApiResponse
    const rawText = body.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      return { ok: false, reason: 'EMPTY_GEMINI_RESPONSE' }
    }

    const parsed = JSON.parse(rawText) as T
    const usage = body.usageMetadata
      ? {
          promptTokens: body.usageMetadata.promptTokenCount ?? 0,
          candidatesTokens: body.usageMetadata.candidatesTokenCount ?? 0,
          totalTokens: body.usageMetadata.totalTokenCount ?? 0
        }
      : undefined

    return {
      ok: true,
      data: parsed,
      model: env.aiModel,
      tokenUsage: usage
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, reason: 'GEMINI_TIMEOUT' }
    }
    return { ok: false, reason: 'GEMINI_NETWORK_OR_PARSE_ERROR' }
  } finally {
    clearTimeout(timer)
  }
}

export async function getGeminiEmbedding(
  text: string,
  options: {
    env?: AiPipelineEnv
    fetchImpl?: typeof fetch
    model?: string
  } = {}
): Promise<number[] | null> {
  const env = options.env ?? loadEnv()
  const fetchFn = options.fetchImpl ?? globalThis.fetch
  if (!env.aiApiKey || !text.trim()) return null

  const model = options.model ?? 'text-embedding-004'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.min(env.aiTimeoutMs, 6000))

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:embedContent?key=${encodeURIComponent(env.aiApiKey)}`

    const res = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        }
      })
    })
    if (!res.ok) return null
    const json = (await res.json()) as { embedding?: { values?: number[] } }
    return Array.isArray(json.embedding?.values) ? json.embedding.values : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
