import { describe, it, expect, vi } from 'vitest'
import { callGeminiStructured } from '../src/providers/geminiClient.js'

const baseEnv = {
  port: 8001,
  serviceKey: '',
  aiApiKey: '',
  aiModel: 'gemini-2.5-flash',
  aiTimeoutMs: 5000,
  enableTonePolish: false,
  allowedOrigins: []
}

describe('callGeminiStructured', () => {
  it('returns MISSING_API_KEY when AI_API_KEY is empty', async () => {
    const res = await callGeminiStructured({
      prompt: 'test',
      systemInstruction: 'sys',
      responseSchema: { type: 'OBJECT' },
      env: baseEnv
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('MISSING_API_KEY')
  })

  it('parses valid JSON structured output and token usage from Gemini API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ title: 'OK' }) }] } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 }
      })
    })
    const res = await callGeminiStructured<{ title: string }>({
      prompt: 'test',
      systemInstruction: 'sys',
      responseSchema: { type: 'OBJECT' },
      env: { ...baseEnv, aiApiKey: 'test-key' },
      fetchImpl: fetchMock as unknown as typeof fetch
    })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.data.title).toBe('OK')
      expect(res.tokenUsage?.totalTokens).toBe(30)
    }
  })

  it('gracefully returns error on non-2xx or malformed JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'unavailable' })
    const res = await callGeminiStructured({
      prompt: 'test',
      systemInstruction: 'sys',
      responseSchema: { type: 'OBJECT' },
      env: { ...baseEnv, aiApiKey: 'test-key' },
      fetchImpl: fetchMock as unknown as typeof fetch
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('GEMINI_HTTP_503')
  })
})
