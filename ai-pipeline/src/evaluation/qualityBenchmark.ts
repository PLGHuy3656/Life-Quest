import { performance } from 'node:perf_hooks'
import type { AiPipelineEnv } from '../config/env.js'
import { GeneratedPlanBodySchema } from '../domain/schemas.js'
import type { QualityBenchmarkSuiteReport } from '../domain/types.js'
import { runFoxAssistantChat } from '../engines/foxAssistantAgent.js'
import { generateAiPlan } from '../engines/planGenerator.js'
import {
  resetProofHashRegistry,
  verifyTaskCompletionProof
} from '../engines/proofVerificationService.js'

const BENCHMARK_ENV: AiPipelineEnv = {
  port: 0,
  serviceKey: '',
  aiApiKey: '',
  aiModel: 'gemini-2.5-flash',
  aiTimeoutMs: 5000,
  enableTonePolish: false,
  allowedOrigins: []
}

export async function runQualityBenchmarkSuite(): Promise<QualityBenchmarkSuiteReport> {
  // 1. Companion Chat Domain, Generalization & Conciseness Benchmark
  const chatCases: Array<{
    message: string
    expectedScope: 'IN_DOMAIN' | 'OUT_OF_DOMAIN'
    expectedTopic?: string
  }> = [
    { message: 'Hôm nay mình còn mấy nhiệm vụ?', expectedScope: 'IN_DOMAIN' },
    { message: 'cơ chế đăng nhập của life quest ra sao?', expectedScope: 'IN_DOMAIN', expectedTopic: 'AUTH_SECURITY' },
    { message: 'tính năng kết bạn?', expectedScope: 'IN_DOMAIN', expectedTopic: 'FRIENDS_SOCIAL' },
    { message: 'add friend ở đâu vậy?', expectedScope: 'IN_DOMAIN', expectedTopic: 'FRIENDS_SOCIAL' },
    { message: 'Quiet hours hoạt động thế nào?', expectedScope: 'IN_DOMAIN' },
    { message: 'Nên mua món gì trang trí Fox?', expectedScope: 'IN_DOMAIN' },
    { message: 'Fox béo quá đi mất!', expectedScope: 'IN_DOMAIN' },
    { message: 'Hôm nay thi xong vui quá trời!', expectedScope: 'IN_DOMAIN' },
    { message: 'Giá vàng SJC hôm nay bao nhiêu?', expectedScope: 'OUT_OF_DOMAIN' },
    { message: 'Viết code Python tìm đường đi ngắn nhất hộ tôi', expectedScope: 'OUT_OF_DOMAIN' },
    { message: 'Ai vô địch World Cup năm ngoái?', expectedScope: 'OUT_OF_DOMAIN' }
  ]

  let chatPassed = 0
  const chatStart = performance.now()
  for (const tc of chatCases) {
    const res = await runFoxAssistantChat({ message: tc.message }, { env: BENCHMARK_ENV })
    const scopeOk = res.scope === tc.expectedScope
    const topicOk = !tc.expectedTopic || (res.matchedKnowledgeTopics ?? []).includes(tc.expectedTopic)
    const conciseOk = res.reply.length <= 250
    if (scopeOk && topicOk && conciseOk) chatPassed += 1
  }
  const chatAvgMs = (performance.now() - chatStart) / chatCases.length

  // 2. Proof Verification Rubric & Duplicate Anti-Cheat Benchmark
  resetProofHashRegistry()
  const imgA = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='.repeat(4)
  const imgB = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'.repeat(6)

  let proofPassed = 0
  const proofStart = performance.now()

  const p1 = await verifyTaskCompletionProof(
    {
      userId: 'bench-user',
      questId: 'bench-q1',
      questTitle: 'Chạy bộ buổi sáng 20 phút',
      userNote: 'Chụp giày chạy bộ ngoài công viên sáng nay',
      fileName: 'chay-bo.jpg',
      imageMimeType: 'image/jpeg',
      imageBase64: imgA
    },
    { env: BENCHMARK_ENV }
  )
  if (p1.verified && p1.qualityRubric.overallScore >= 85 && p1.bonusXp === 10) proofPassed += 1

  // Reuse identical image on a different quest -> must detect duplicate
  const p2 = await verifyTaskCompletionProof(
    {
      userId: 'bench-user',
      questId: 'bench-q2',
      questTitle: 'Đọc 15 trang sách',
      userNote: 'Đọc sách xong rồi',
      fileName: 'doc-sach.jpg',
      imageMimeType: 'image/jpeg',
      imageBase64: imgA
    },
    { env: BENCHMARK_ENV }
  )
  if (!p2.verified && p2.duplicateDetected && p2.verdict === 'REJECTED') proofPassed += 1

  // Unrelated photo -> must reject
  const p3 = await verifyTaskCompletionProof(
    {
      userId: 'bench-user',
      questId: 'bench-q3',
      questTitle: 'Ôn thi CNPM 45 phút',
      userNote: 'Chụp ly trà sữa đi chơi với bạn',
      fileName: 'tra-sua.jpg',
      imageMimeType: 'image/jpeg',
      imageBase64: imgB
    },
    { env: BENCHMARK_ENV }
  )
  if (!p3.verified && p3.verdict === 'REJECTED') proofPassed += 1
  const proofAvgMs = (performance.now() - proofStart) / 3

  // 3. Roadmap Structural Validity Benchmark
  const roadmapPrompts = [
    { prompt: 'Học IELTS 6.5 trong 30 ngày', durationDays: 30, availableMinutesPerDay: 45, level: 'INTERMEDIATE' as const, timezone: 'Asia/Ho_Chi_Minh' },
    { prompt: 'Chạy bộ giảm cân 14 ngày', durationDays: 14, availableMinutesPerDay: 30, level: 'BEGINNER' as const, timezone: 'Asia/Ho_Chi_Minh' },
    { prompt: 'Hoàn thiện đồ án CNPM trong 7 ngày', durationDays: 7, availableMinutesPerDay: 90, level: 'ADVANCED' as const, timezone: 'Asia/Ho_Chi_Minh' }
  ]

  let roadmapPassed = 0
  const roadmapStart = performance.now()
  for (const input of roadmapPrompts) {
    const plan = await generateAiPlan(input, { env: BENCHMARK_ENV })
    const valid = GeneratedPlanBodySchema.safeParse(plan).success
    if (valid && plan.milestones.length >= 2) roadmapPassed += 1
  }
  const roadmapAvgMs = (performance.now() - roadmapStart) / roadmapPrompts.length

  const chatPct = Math.round((chatPassed / chatCases.length) * 100)
  const proofPct = Math.round((proofPassed / 3) * 100)
  const roadmapPct = Math.round((roadmapPassed / roadmapPrompts.length) * 100)
  const overallScorePercent = Math.round((chatPct + proofPct + roadmapPct) / 3)
  const averageLatencyMs = Number(((chatAvgMs + proofAvgMs + roadmapAvgMs) / 3).toFixed(2))

  return {
    generatedAt: new Date().toISOString(),
    overallScorePercent,
    passed: overallScorePercent >= 90,
    metrics: {
      chatDomainAccuracyPercent: chatPct,
      proofVerificationAccuracyPercent: proofPct,
      roadmapSchemaValidityPercent: roadmapPct,
      averageLatencyMs
    },
    details: [
      {
        suite: 'Companion Chat Domain & Generalization',
        passedCases: chatPassed,
        totalCases: chatCases.length,
        scorePercent: chatPct,
        avgLatencyMs: Number(chatAvgMs.toFixed(2))
      },
      {
        suite: 'Proof Quality Rubric & Duplicate Anti-Cheat',
        passedCases: proofPassed,
        totalCases: 3,
        scorePercent: proofPct,
        avgLatencyMs: Number(proofAvgMs.toFixed(2))
      },
      {
        suite: 'Goal Roadmap Schema Validity',
        passedCases: roadmapPassed,
        totalCases: roadmapPrompts.length,
        scorePercent: roadmapPct,
        avgLatencyMs: Number(roadmapAvgMs.toFixed(2))
      }
    ]
  }
}
