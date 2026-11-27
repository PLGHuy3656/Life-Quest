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

describe('RESTful AI Agents API (/v1/agents/*)', () => {
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

  it('GET /v1/agents/catalog lists all 8 specialized LifeQuest AI Agents', async () => {
    const res = await fetch(`${baseUrl}/v1/agents/catalog`)
    const json = (await res.json()) as Record<string, any>
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.totalAgents).toBe(8)
    expect(json.data.agents.map((a: { id: string }) => a.id)).toContain('fox-assistant')
    expect(json.data.agents.map((a: { id: string }) => a.id)).toContain('alarm-coach')
  })

  it('POST /v1/agents/fox-assistant/chat answers LifeQuest questions and rejects out-of-domain topics politely', async () => {
    const inDomain = await postJson('/v1/agents/fox-assistant/chat', {
      message: 'Tôi nên mua gì để trang trí Fox?',
      userContext: { userName: 'Khánh', coinBalance: 340, completedToday: 2, totalToday: 4 }
    })
    expect(inDomain.status).toBe(200)
    expect(inDomain.body.data.scope).toBe('IN_DOMAIN')
    expect(inDomain.body.data.intent).toBe('WARDROBE_ADVICE')
    expect(inDomain.body.data.reply).toContain('Kính Học Giả')
    expect(inDomain.body.data.suggestedActions.length).toBeGreaterThan(0)

    const outOfDomain = await postJson('/v1/agents/fox-assistant/chat', {
      message: 'Hôm nay giá vàng và thời tiết Sài Gòn thế nào?',
      userContext: { userName: 'Khánh' }
    })
    expect(outOfDomain.status).toBe(200)
    expect(outOfDomain.body.data.scope).toBe('OUT_OF_DOMAIN')
    expect(outOfDomain.body.data.intent).toBe('OUT_OF_SCOPE')
    expect(outOfDomain.body.data.reply).toContain('LifeQuest')
  })

  it('POST /v1/agents/alarm-coach/minigame/generate builds playable challenges for all 4 game types', async () => {
    const mathRes = await postJson('/v1/agents/alarm-coach/minigame/generate', {
      miniGameType: 'MATH',
      difficulty: 'MEDIUM'
    })
    expect(mathRes.status).toBe(200)
    expect(mathRes.body.data.mathProblems).toHaveLength(2)

    const memRes = await postJson('/v1/agents/alarm-coach/minigame/generate', {
      miniGameType: 'MEMORY_SEQUENCE',
      difficulty: 'HARD'
    })
    expect(memRes.status).toBe(200)
    expect(memRes.body.data.memorySequence).toHaveLength(5)

    const typingRes = await postJson('/v1/agents/alarm-coach/minigame/generate', {
      miniGameType: 'TYPING',
      difficulty: 'EASY'
    })
    expect(typingRes.status).toBe(200)
    expect(typeof typingRes.body.data.typingTarget).toBe('string')

    const tapRes = await postJson('/v1/agents/alarm-coach/minigame/generate', {
      miniGameType: 'QUICK_TAP',
      difficulty: 'MEDIUM'
    })
    expect(tapRes.status).toBe(200)
    expect(tapRes.body.data.quickTapTargetCount).toBe(12)
  })

  it('POST /v1/agents/roadmap-architect/generate and /refine return structured roadmaps', async () => {
    const gen = await postJson('/v1/agents/roadmap-architect/generate', {
      prompt: 'Ôn thi CNPM trong 7 ngày',
      durationDays: 7,
      availableMinutesPerDay: 45
    })
    expect(gen.status).toBe(200)
    expect(gen.body.data.milestones.length).toBeGreaterThanOrEqual(2)

    const refine = await postJson('/v1/agents/roadmap-architect/refine', {
      prompt: 'Ôn thi CNPM trong 7 ngày',
      durationDays: 7,
      availableMinutesPerDay: 30,
      feedback: 'Giảm tải xuống 30 phút mỗi ngày'
    })
    expect(refine.status).toBe(200)
    expect(refine.body.data.feedbackNote).toContain('30 phút')
  })

  it('POST /v1/agents/progress-coach/evaluate and /notification-planner/schedule work cleanly', async () => {
    const nudge = await postJson('/v1/agents/progress-coach/evaluate', {
      entityType: 'GOAL',
      entityId: 'g-1',
      title: 'Học IELTS 6.5',
      completedCount: 2,
      totalCount: 4
    })
    expect(nudge.status).toBe(200)
    expect(nudge.body.data.stage).toBe('HALFWAY_50')

    const notif = await postJson('/v1/agents/notification-planner/schedule', {
      userId: 'u-1',
      localHour: 23,
      events: [
        { id: 'e1', type: 'progress.nudge_50', title: '50%', body: 'Cố lên', priority: 'NORMAL' },
        { id: 'e2', type: 'alarm.ringing', title: 'Báo thức', body: 'Dậy ngay', priority: 'URGENT' }
      ]
    })
    expect(notif.status).toBe(200)
    expect(notif.body.data.inQuietHours).toBe(true)
    expect(notif.body.data.sendNowCount).toBe(1)
    expect(notif.body.data.deferredCount).toBe(1)
  })

  it('GET /v1/agents/knowledge/lifequest and POST /v1/agents/knowledge/search power generalized RAG queries', async () => {
    const allRes = await fetch(`${baseUrl}/v1/agents/knowledge/lifequest`)
    const allJson = (await allRes.json()) as Record<string, any>
    expect(allRes.status).toBe(200)
    expect(allJson.data.totalDocuments).toBe(12)

    const searchRes = await postJson('/v1/agents/knowledge/search', {
      query: 'lam sao dung streak freeze khi ban dot xuat',
      topK: 2
    })
    expect(searchRes.status).toBe(200)
    expect(searchRes.body.data.results[0].doc.topic).toBe('SOCIAL_GROUP_STREAK')

    const generalizedChat = await postJson('/v1/agents/fox-assistant/chat', {
      message: 'Quiet hours trong LifeQuest hoat dong nhu the nao?'
    })
    expect(generalizedChat.status).toBe(200)
    expect(generalizedChat.body.data.scope).toBe('IN_DOMAIN')
    expect(generalizedChat.body.data.reply).toContain('22:00')
  })

  it('GET/POST /v1/agents/alarm-coach/daily-wakeup enforces 07:00 once-per-day mission and rotates mini-game next day', async () => {
    const day1 = await fetch(`${baseUrl}/v1/agents/alarm-coach/daily-wakeup?userId=u-rot&dateKey=2026-11-27`)
    const day1Json = (await day1.json()) as Record<string, any>
    expect(day1.status).toBe(200)
    expect(day1Json.data.alarmTime).toBe('07:00')
    expect(day1Json.data.completedToday).toBe(false)
    const day1Game = day1Json.data.todayChallenge.miniGameType

    const doneRes = await postJson('/v1/agents/alarm-coach/daily-wakeup/complete', {
      userId: 'u-rot',
      dateKey: '2026-11-27'
    })
    expect(doneRes.status).toBe(200)
    expect(doneRes.body.data.completedToday).toBe(true)

    // Next day must unlock again and rotate to a different mini-game type
    const day2 = await fetch(`${baseUrl}/v1/agents/alarm-coach/daily-wakeup?userId=u-rot&dateKey=2026-11-28`)
    const day2Json = (await day2.json()) as Record<string, any>
    expect(day2.status).toBe(200)
    expect(day2Json.data.completedToday).toBe(false)
    expect(day2Json.data.todayChallenge.miniGameType).not.toBe(day1Game)
  })
})
