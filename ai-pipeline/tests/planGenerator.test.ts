import { describe, it, expect, vi } from 'vitest'
import { generateAiPlan } from '../src/engines/planGenerator.js'

const testEnv = {
  port: 8001,
  serviceKey: '',
  aiApiKey: 'fake-key',
  aiModel: 'gemini-2.5-flash',
  aiTimeoutMs: 5000,
  enableTonePolish: false,
  allowedOrigins: []
}

describe('generateAiPlan', () => {
  it('scales milestones by durationDays and includes scheduleSuggestion', async () => {
    const shortPlan = await generateAiPlan(
      { prompt: 'Chạy bộ buổi sáng', durationDays: 7, availableMinutesPerDay: 30, level: 'BEGINNER', timezone: 'Asia/Ho_Chi_Minh' },
      { allowLlm: false }
    )
    const medPlan = await generateAiPlan(
      { prompt: 'Học IELTS 6.5', durationDays: 30, availableMinutesPerDay: 60, level: 'INTERMEDIATE', timezone: 'Asia/Ho_Chi_Minh' },
      { allowLlm: false }
    )
    const longPlan = await generateAiPlan(
      { prompt: 'Xây dựng đồ án React Node', durationDays: 60, availableMinutesPerDay: 90, level: 'ADVANCED', timezone: 'Asia/Ho_Chi_Minh' },
      { allowLlm: false }
    )

    expect(shortPlan.milestones).toHaveLength(2)
    expect(medPlan.milestones).toHaveLength(3)
    expect(longPlan.milestones).toHaveLength(4)
    expect(medPlan.milestones[0].quests[0].scheduleSuggestion?.timeOfDay).toMatch(/^\d{2}:\d{2}$/)
  })

  it('never calls Gemini when allowLlm is false (preview mode)', async () => {
    const fetchMock = vi.fn()
    const plan = await generateAiPlan(
      { prompt: 'Đọc sách 20 phút', durationDays: 14, availableMinutesPerDay: 20, level: 'BEGINNER', timezone: 'Asia/Ho_Chi_Minh' },
      { allowLlm: false, env: testEnv, fetchImpl: fetchMock as unknown as typeof fetch }
    )
    expect(fetchMock).not.toHaveBeenCalled()
    expect(plan.generationMeta.provider).toBe('deterministic-fallback')
    expect(plan.generationMeta.fallbackUsed).toBe(false)
  })

  it('adapts duration and sets feedbackNote when regenerating with lighter feedback', async () => {
    const plan = await generateAiPlan(
      {
        prompt: 'Luyện lập trình TypeScript',
        durationDays: 21,
        availableMinutesPerDay: 60,
        level: 'BEGINNER',
        feedback: 'Làm nhẹ hơn và chuyển sang buổi sáng',
        timezone: 'Asia/Ho_Chi_Minh'
      },
      { allowLlm: false }
    )
    expect(plan.feedbackNote).toContain('nhẹ hơn')
    expect(plan.dailyAvailableMinutes).toBeLessThan(60)
    expect(plan.milestones[0].quests[0].scheduleSuggestion?.timeOfDay).toBe('07:00')
  })

  it('returns Gemini structured output and tokenUsage when allowLlm is true', async () => {
    const mockGeminiBody = {
      title: 'Lộ trình IELTS 14 ngày',
      category: 'Học tập',
      goal: { title: 'IELTS 6.5', description: 'Mục tiêu ngắn hạn', durationDays: 14 },
      milestones: [
        {
          title: 'Tuần 1',
          description: 'Nền tảng',
          position: 1,
          quests: [
            {
              title: 'Luyện nghe Part 1-2',
              description: '30 phút mỗi tối',
              priority: 1,
              type: 'FOCUS',
              estimatedDurationSeconds: 1800,
              xpReward: 60,
              coinReward: 25,
              scheduleSuggestion: { scheduleType: 'RECURRING', timeOfDay: '20:00', daysOfWeek: [1, 3, 5] }
            }
          ]
        }
      ]
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockGeminiBody) }] } }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 200, totalTokenCount: 300 }
      })
    })

    const plan = await generateAiPlan(
      { prompt: 'IELTS 6.5', durationDays: 14, availableMinutesPerDay: 45, level: 'INTERMEDIATE', timezone: 'Asia/Ho_Chi_Minh' },
      { allowLlm: true, env: testEnv, fetchImpl: fetchMock as unknown as typeof fetch }
    )
    expect(plan.generationMeta.provider).toBe('gemini')
    expect(plan.generationMeta.fallbackUsed).toBe(false)
    expect(plan.generationMeta.tokenUsage?.totalTokens).toBe(300)
    expect(plan.milestones[0].quests[0].title).toBe('Luyện nghe Part 1-2')
  })
})
