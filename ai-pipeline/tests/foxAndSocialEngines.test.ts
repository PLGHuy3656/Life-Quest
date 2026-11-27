import { describe, it, expect } from 'vitest'
import { analyzeBehavior14d } from '../src/engines/behaviorAnalyzer.js'
import { generateMascotDialogue, polishRecommendationsWithFoxTone } from '../src/engines/foxTonePolisher.js'
import { buildGroupChatAssist } from '../src/engines/groupChatAssistEngine.js'
import { parseMascotIntent } from '../src/engines/mascotIntentEngine.js'

describe('Fox Tone, Mascot Intent & Group Chat Assist engines', () => {
  it('polishes recommendation reasons deterministically with Fox voice when LLM is disabled', async () => {
    const raw = analyzeBehavior14d({
      userId: 'u-1',
      timezone: 'Asia/Ho_Chi_Minh',
      allowMockFallback: true,
      activeQuests: [],
      activeSchedules: [],
      executions: [],
      focusSessions: [],
      streaks: [],
      coinBalance: 0,
      friendChallenges: []
    })

    const polished = await polishRecommendationsWithFoxTone(raw, { enableLlm: false })
    expect(polished).toHaveLength(7)
    expect(polished.some((p) => p.reason.includes('Fox'))).toBe(true)
  })

  it('extracts durationDays, minutes, level, and category in parseMascotIntent', () => {
    const res = parseMascotIntent('Học IELTS nâng cao 45 phút mỗi ngày trong 14 ngày')
    expect(res.durationDays).toBe(14)
    expect(res.availableMinutesPerDay).toBe(45)
    expect(res.level).toBe('ADVANCED')
    expect(res.targetCategory).toBe('Học tập & Tri thức')
    expect(res.suggestedEntity).toBe('AI_PLAN')
  })

  it('generates contextual mascot dialogue cleanly', () => {
    const res = generateMascotDialogue({ event: 'PLAN_APPLIED', userName: 'Khánh' })
    expect(res.source).toBe('AI_PIPELINE')
    expect(res.text).toContain('Khánh')
  })

  it('replies warmly to short USER_CHAT greetings and wardrobe questions instead of echoing', () => {
    const hiRes = generateMascotDialogue({ event: 'USER_CHAT', userName: 'Khánh', contextText: 'hi' })
    expect(hiRes.text).toContain('Chào Khánh')
    expect(hiRes.emotion).toBe('happy')

    const styleRes = generateMascotDialogue({ event: 'USER_CHAT', userName: 'Khánh', contextText: 'mua đồ trang trí' })
    expect(styleRes.text).toContain('Kính Học Giả')
    expect(styleRes.emotion).toBe('playful')
  })

  it('builds STREAK_NOTICE group chat payload with mock fallback when groupContext omitted', () => {
    const res = buildGroupChatAssist({
      conversationId: 'mock-group-study-squad',
      mode: 'STREAK_RISK_NUDGE'
    })
    expect(res.dataSource).toBe('MOCK')
    expect(res.messageKind).toBe('STREAK_NOTICE')
    expect(res.targetPendingUserIds.length).toBeGreaterThan(0)
    expect(res.content).toContain('Nhóm Cày Đồ Án CNPM')
  })
})
