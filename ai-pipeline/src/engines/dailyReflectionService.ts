import { loadEnv, type AiPipelineEnv } from '../config/env.js'
import type {
  DailyReflectionRequest,
  DailyReflectionResponse,
  FoxPersonaStyle
} from '../domain/types.js'
import { callGeminiStructured } from '../providers/geminiClient.js'

function buildDeterministicReflection(req: DailyReflectionRequest): DailyReflectionResponse {
  const userName = req.userName?.trim() || 'bạn'
  const persona: FoxPersonaStyle = req.personaStyle ?? 'WARM_COACH'
  const pct = Math.min(100, Math.round((req.completedCount / Math.max(1, req.totalCount)) * 100))
  const streak = req.currentStreak ?? 12
  const proofs = req.verifiedProofCount ?? 0
  const firstPending = req.pendingTitles?.[0]

  const highlightOfDay =
    proofs > 0
      ? `Đã xác thực ${proofs} ảnh hoàn thành và giữ chuỗi ${streak} ngày liên tiếp.`
      : pct >= 50
        ? `Vượt mốc ${pct}% mục tiêu ngày (${req.completedCount}/${req.totalCount}) và giữ chuỗi ${streak} ngày.`
        : `Vẫn duy trì nhịp hành động với ${req.completedCount} việc đã chốt hôm nay.`

  const tomorrowTip = firstPending
    ? `Sáng mai ưu tiên mở đầu bằng "${firstPending}" trong khung giờ tập trung 25 phút nhé.`
    : 'Sáng mai dậy đúng 07:00 hoàn thành mini-game nhận Bonus XP khởi đầu ngày mới!'

  if (persona === 'PLAYFUL_BUDDY') {
    return {
      headline: `Tổng kết ngày siêu cháy của ${userName} (${pct}%)`,
      summary: `Hôm nay ${userName} chốt gọn ${req.completedCount}/${req.totalCount} nhiệm vụ — Fox cho 10 điểm năng lượng luôn! Nghỉ ngơi nạp pin để mai lại bứt tốc tiếp nha.`,
      highlightOfDay,
      tomorrowTip,
      foxSignOff: 'Ngủ ngon nha đồng đội, 07:00 mai Fox gọi dậy săn Bonus XP!',
      completionPercent: pct,
      personaStyle: persona,
      provider: 'reflection-engine'
    }
  }

  if (persona === 'STRICT_MENTOR') {
    return {
      headline: `Báo cáo kỷ luật hôm nay: ${pct}% (${req.completedCount}/${req.totalCount})`,
      summary:
        pct >= 80
          ? `Hiệu suất rất tốt (${pct}%). Tiếp tục giữ kỷ luật này để không rớt chuỗi ${streak} ngày.`
          : `Hôm nay đạt ${pct}%. Còn ${Math.max(0, req.totalCount - req.completedCount)} việc chưa xong — ngày mai cần khóa khung giờ vàng và xử lý dứt điểm việc ưu tiên trước.`,
      highlightOfDay,
      tomorrowTip,
      foxSignOff: 'Kỷ luật tạo nên kết quả. Hẹn đúng 07:00 sáng mai!',
      completionPercent: pct,
      personaStyle: persona,
      provider: 'reflection-engine'
    }
  }

  return {
    headline: `Nhật ký cuối ngày cùng Fox (${pct}%)`,
    summary: `Hôm nay ${userName} đã hoàn thành ${req.completedCount}/${req.totalCount} việc. Dù nhanh hay chậm, mỗi bước tiến nhỏ đều đáng tự hào — hãy thả lỏng và nghỉ ngơi thật ngon nhé.`,
    highlightOfDay,
    tomorrowTip,
    foxSignOff: 'Fox luôn đồng hành cùng bạn. Chúc bạn một buổi tối thật êm dịu!',
    completionPercent: pct,
    personaStyle: persona,
    provider: 'reflection-engine'
  }
}

export async function generateDailyReflection(
  req: DailyReflectionRequest,
  options: { env?: AiPipelineEnv; fetchImpl?: typeof fetch } = {}
): Promise<DailyReflectionResponse> {
  const fallback = buildDeterministicReflection(req)
  const env = options.env ?? loadEnv()
  if (!env.aiApiKey) return fallback

  const schema: Record<string, unknown> = {
    type: 'OBJECT',
    required: ['headline', 'summary', 'highlightOfDay', 'tomorrowTip', 'foxSignOff'],
    properties: {
      headline: { type: 'STRING' },
      summary: { type: 'STRING' },
      highlightOfDay: { type: 'STRING' },
      tomorrowTip: { type: 'STRING' },
      foxSignOff: { type: 'STRING' }
    }
  }

  const personaGuide =
    req.personaStyle === 'PLAYFUL_BUDDY'
      ? 'giọng bạn thân vui tính, hóm hỉnh'
      : req.personaStyle === 'STRICT_MENTOR'
        ? 'giọng huấn luyện viên kỷ luật, thẳng thắn nhưng tích cực'
        : 'giọng đồng hành ấm áp, nhẹ nhàng chữa lành'

  const llm = await callGeminiStructured<{
    headline: string
    summary: string
    highlightOfDay: string
    tomorrowTip: string
    foxSignOff: string
  }>({
    prompt: JSON.stringify(req),
    systemInstruction: `Bạn là Cáo Fox của LifeQuest. Hãy viết thẻ tổng kết cuối ngày bằng tiếng Việt ngắn gọn, chân thành theo ${personaGuide}.`,
    responseSchema: schema,
    temperature: 0.55,
    env,
    fetchImpl: options.fetchImpl
  })

  if (!llm.ok || !llm.data?.summary) return fallback
  return {
    ...fallback,
    ...llm.data,
    provider: 'gemini'
  }
}
