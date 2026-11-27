import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAiPipelineApp } from '../src/app.js'
import type { AiPipelineEnv } from '../src/config/env.js'

const TEST_ENV: AiPipelineEnv = {
  port: 0,
  serviceKey: '',
  aiApiKey: '',
  aiModel: 'gemini-2.5-flash',
  aiTimeoutMs: 5000,
  enableTonePolish: false,
  allowedOrigins: []
}

describe('Standard Domain REST APIs (/v1/*)', () => {
  let server: Server
  let baseUrl = ''

  beforeAll(async () => {
    const app = createAiPipelineApp(TEST_ENV)
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address()
        const port = typeof addr === 'object' && addr ? addr.port : 0
        baseUrl = `http://127.0.0.1:${port}`
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  async function postJson(path: string, body: unknown) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return { status: res.status, body: (await res.json()) as Record<string, any> }
  }

  it('GET /v1/capabilities exposes all 11 domain services cleanly without agent naming', async () => {
    const res = await fetch(`${baseUrl}/v1/capabilities`)
    const json = (await res.json()) as Record<string, any>
    expect(res.status).toBe(200)
    expect(json.data.totalCapabilities).toBe(11)
    expect(json.data.capabilities.map((c: { id: string }) => c.id)).toContain('proof-verification')
    expect(json.data.capabilities.map((c: { id: string }) => c.id)).toContain('daily-reflection')
    expect(json.data.capabilities.map((c: { id: string }) => c.id)).toContain('quality-benchmark')
  })

  it('POST /v1/proofs/verify approves matching completion proofs and rejects unrelated photos', async () => {
    const dummyImg = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

    const approved = await postJson('/v1/proofs/verify', {
      questId: 'q-run-1',
      questTitle: 'Chạy bộ 20 phút buổi sáng',
      userNote: 'Ảnh giày chạy bộ ngoài công viên sáng nay',
      fileName: 'chay-bo-sang.jpg',
      imageMimeType: 'image/jpeg',
      imageBase64: dummyImg
    })
    expect(approved.status).toBe(200)
    expect(approved.body.data.verdict).toBe('APPROVED')
    expect(approved.body.data.verified).toBe(true)
    expect(approved.body.data.recommendedShareTargets).toContain('PRIVATE_JOURNAL')
    expect(approved.body.data.recommendedShareTargets).toContain('SOCIAL_FEED')

    const rejected = await postJson('/v1/proofs/verify', {
      questId: 'q-ielts-1',
      questTitle: 'Học IELTS Writing 30 phút',
      userNote: 'Chụp ly trà sữa đi chơi với bạn',
      fileName: 'tra-sua-chill.jpg',
      imageMimeType: 'image/jpeg',
      imageBase64: dummyImg
    })
    expect(rejected.status).toBe(200)
    expect(rejected.body.data.verdict).toBe('REJECTED')
    expect(rejected.body.data.verified).toBe(false)
  })

  it('POST /v1/assistant/chat handles playful teasing, emotions, LifeQuest RAG, and out-of-domain guardrails', async () => {
    const tease = await postJson('/v1/assistant/chat', {
      message: 'Fox béo quá đi mất!',
      userContext: { userName: 'Khánh' }
    })
    expect(tease.status).toBe(200)
    expect(tease.body.data.scope).toBe('IN_DOMAIN')
    expect(tease.body.data.emotion).toBe('playful')

    const happy = await postJson('/v1/assistant/chat', {
      message: 'Hôm nay mình vừa thi xong nhẹ cả người, vui quá!',
      userContext: { userName: 'Khánh' }
    })
    expect(happy.status).toBe(200)
    expect(happy.body.data.scope).toBe('IN_DOMAIN')
    expect(happy.body.data.emotion).toBe('happy')

    const external = await postJson('/v1/assistant/chat', {
      message: 'Giá vàng SJC và thời tiết hôm nay ra sao?'
    })
    expect(external.status).toBe(200)
    expect(external.body.data.scope).toBe('OUT_OF_DOMAIN')
  })

  it('POST /v1/reflections/daily-summary and GET /v1/quality/benchmark return valid reports', async () => {
    const recap = await postJson('/v1/reflections/daily-summary', {
      userName: 'Khánh',
      personaStyle: 'PLAYFUL_BUDDY',
      completedCount: 3,
      totalCount: 4,
      verifiedProofCount: 2,
      currentStreak: 12
    })
    expect(recap.status).toBe(200)
    expect(recap.body.data.completionPercent).toBe(75)
    expect(recap.body.data.personaStyle).toBe('PLAYFUL_BUDDY')

    const benchRes = await fetch(`${baseUrl}/v1/quality/benchmark`)
    const benchJson = (await benchRes.json()) as Record<string, any>
    expect(benchRes.status).toBe(200)
    expect(benchJson.data.passed).toBe(true)
    expect(benchJson.data.overallScorePercent).toBe(100)
  })

  it('POST /v1/assistant/chat answers "tính năng kết bạn?" concisely and persists session history', async () => {
    const sid = 'sess-test-1'
    const r1 = await postJson('/v1/assistant/chat', {
      sessionId: sid,
      message: 'tính năng kết bạn?'
    })
    expect(r1.status).toBe(200)
    expect(r1.body.data.matchedKnowledgeTopics).toContain('FRIENDS_SOCIAL')
    expect(r1.body.data.reply.length).toBeLessThanOrEqual(240)

    const r2 = await postJson('/v1/assistant/chat', {
      sessionId: sid,
      message: 'cơ chế đăng nhập của life quest ra sao?'
    })
    expect(r2.status).toBe(200)
    expect(r2.body.data.matchedKnowledgeTopics).toContain('AUTH_SECURITY')
    expect(r2.body.data.reply.length).toBeLessThanOrEqual(240)

    const histRes = await fetch(`${baseUrl}/v1/assistant/sessions/${sid}`)
    const histJson = (await histRes.json()) as Record<string, any>
    expect(histRes.status).toBe(200)
    expect(histJson.data.totalMessages).toBe(4)
  })
})
