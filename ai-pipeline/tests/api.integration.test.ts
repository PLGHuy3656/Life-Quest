import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Server } from 'node:http'
import { createAiPipelineApp } from '../src/app.js'

let server: Server
let baseUrl = ''

const TEST_SERVICE_KEY = 'test-secret-key'

beforeAll(async () => {
  const app = createAiPipelineApp({
    port: 0,
    serviceKey: TEST_SERVICE_KEY,
    aiApiKey: '',
    aiModel: 'gemini-2.5-flash',
    aiTimeoutMs: 5000,
    enableTonePolish: false,
    allowedOrigins: ['http://localhost:5173']
  })
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`
      }
      resolve()
    })
  })
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

describe('ai-pipeline HTTP API integration', () => {
  it('GET /health returns ok status', async () => {
    const res = await fetch(`${baseUrl}/health`)
    const json = (await res.json()) as { success: boolean; data: { status: string; service: string } }
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.service).toBe('lifequest-ai-pipeline')
  })

  it('rejects /v1/plans/generate without valid x-ai-service-key', async () => {
    const res = await fetch(`${baseUrl}/v1/plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Học React 14 ngày' })
    })
    expect(res.status).toBe(401)
  })

  it('allows public /v1/plans/preview deterministically without service key', async () => {
    const res = await fetch(`${baseUrl}/v1/plans/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Học React 14 ngày', durationDays: 14, availableMinutesPerDay: 45 })
    })
    const json = (await res.json()) as { success: boolean; data: { generationMeta: { provider: string }; milestones: unknown[] } }
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.generationMeta.provider).toBe('deterministic-fallback')
    expect(json.data.milestones.length).toBeGreaterThanOrEqual(2)
  })

  it('returns 400 VALIDATION_ERROR on short prompt', async () => {
    const res = await fetch(`${baseUrl}/v1/plans/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'a' })
    })
    expect(res.status).toBe(400)
  })

  it('serves /v1/mascot/parse-intent and /v1/mascot/dialogue', async () => {
    const intentRes = await fetch(`${baseUrl}/v1/mascot/parse-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Chạy bộ 30 phút trong 2 tuần' })
    })
    const intentJson = (await intentRes.json()) as { success: boolean; data: { durationDays: number; availableMinutesPerDay: number } }
    expect(intentRes.status).toBe(200)
    expect(intentJson.data.durationDays).toBe(14)
    expect(intentJson.data.availableMinutesPerDay).toBe(30)

    const dlgRes = await fetch(`${baseUrl}/v1/mascot/dialogue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'PLAN_GENERATED', userName: 'An' })
    })
    expect(dlgRes.status).toBe(200)
  })

  it('serves /v1/recommendations/preview with 7 ranked mock items', async () => {
    const res = await fetch(`${baseUrl}/v1/recommendations/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'anon-demo' })
    })
    const json = (await res.json()) as { success: boolean; data: { recommendations: unknown[]; dataSource: string } }
    expect(res.status).toBe(200)
    expect(json.data.recommendations).toHaveLength(7)
    expect(json.data.dataSource).toBe('MOCK')
  })

  it('serves /v1/recommendations/wardrobe-stylist and /v1/engagement/* endpoints', async () => {
    const stylistRes = await fetch(`${baseUrl}/v1/recommendations/wardrobe-stylist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    const stylistJson = (await stylistRes.json()) as { success: boolean; data: { suggestions: Array<{ itemId: string }> } }
    expect(stylistRes.status).toBe(200)
    expect(stylistJson.data.suggestions[0]?.itemId).toBe('student_glasses')

    const progressRes = await fetch(`${baseUrl}/v1/engagement/progress-nudge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType: 'GOAL', entityId: 'g-1', title: 'IELTS', completedCount: 2, totalCount: 4 })
    })
    const progressJson = (await progressRes.json()) as { success: boolean; data: { stage: string; progressPercent: number } }
    expect(progressRes.status).toBe(200)
    expect(progressJson.data.stage).toBe('HALFWAY_50')
    expect(progressJson.data.progressPercent).toBe(50)

    const alarmRes = await fetch(`${baseUrl}/v1/engagement/alarm-coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    expect(alarmRes.status).toBe(200)

    const notifRes = await fetch(`${baseUrl}/v1/engagement/notification-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'u1',
        localHour: 23,
        events: [
          { id: '1', type: 'ai.progress.halfway', title: '50%', body: 'Good', priority: 'NORMAL' },
          { id: '2', type: 'alarm.ringing', title: 'Alarm', body: 'Wake up', priority: 'URGENT' }
        ]
      })
    })
    const notifJson = (await notifRes.json()) as { success: boolean; data: { sendNowCount: number; deferredCount: number } }
    expect(notifRes.status).toBe(200)
    expect(notifJson.data.sendNowCount).toBe(1)
    expect(notifJson.data.deferredCount).toBe(1)
  })

  it('serves /v1/social/group-assist when authorized with x-ai-service-key', async () => {
    const res = await fetch(`${baseUrl}/v1/social/group-assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ai-service-key': TEST_SERVICE_KEY
      },
      body: JSON.stringify({ conversationId: 'mock-group-study-squad', mode: 'STREAK_RISK_NUDGE' })
    })
    const json = (await res.json()) as { success: boolean; data: { messageKind: string } }
    expect(res.status).toBe(200)
    expect(json.data.messageKind).toBe('STREAK_NOTICE')
  })
})
