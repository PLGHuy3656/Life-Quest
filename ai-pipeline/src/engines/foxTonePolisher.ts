import { loadEnv, type AiPipelineEnv } from '../config/env.js'
import type {
  DialogueEmotion,
  MascotDialogueRequest,
  MascotDialogueResponse,
  RecommendationCandidate
} from '../domain/types.js'
import { callGeminiStructured } from '../providers/geminiClient.js'

const FOX_PREFIX_BY_TYPE: Record<RecommendationCandidate['type'], string> = {
  SCHEDULE_OPTIMIZATION: 'Fox để ý thấy',
  QUEST_SUGGESTION: 'Đừng ngại nhé, Fox gợi ý',
  CHALLENGE_MATCH: 'Tin vui nè!',
  REWARD_SUGGESTION: 'Cẩn thận kẻo rớt chuỗi nha!',
  PROGRESS_NUDGE: 'Cố lên nhé!',
  COSMETIC_SUGGESTION: 'Góc phối đồ Fox nè!',
  ALARM_OPTIMIZATION: 'Mẹo dậy sớm từ Fox:'
}

function deterministicFoxPolish(item: RecommendationCandidate): string {
  const prefix = FOX_PREFIX_BY_TYPE[item.type]
  if (
    item.reason.startsWith('Fox') ||
    item.reason.startsWith('Đừng ngại') ||
    item.reason.startsWith('Tin vui') ||
    item.reason.startsWith('Cẩn thận') ||
    item.reason.startsWith('Tuyệt vời') ||
    item.reason.startsWith('Nước rút') ||
    item.reason.startsWith('Xuất sắc')
  ) {
    return item.reason
  }
  const lowerFirst = item.reason.charAt(0).toLowerCase() + item.reason.slice(1)
  return `${prefix} ${lowerFirst}`
}

export async function polishRecommendationsWithFoxTone(
  items: RecommendationCandidate[],
  options: {
    enableLlm?: boolean
    env?: AiPipelineEnv
    fetchImpl?: typeof fetch
  } = {}
): Promise<RecommendationCandidate[]> {
  if (items.length === 0) return []
  const env = options.env ?? loadEnv()
  const useLlm = (options.enableLlm ?? env.enableTonePolish) && Boolean(env.aiApiKey)

  if (!useLlm) {
    return items.map((item) => ({
      ...item,
      reason: deterministicFoxPolish(item)
    }))
  }

  const schema: Record<string, unknown> = {
    type: 'OBJECT',
    required: ['reasons'],
    properties: {
      reasons: {
        type: 'ARRAY',
        items: { type: 'STRING' }
      }
    }
  }

  const prompt = [
    'Viết lại từng lý do gợi ý sau theo giọng điệu thân thiện, ấm áp, ngắn gọn (<= 150 ký tự mỗi câu) của linh vật Cáo Fox Companion trong LifeQuest:',
    ...items.map((item, i) => `${i + 1}. [${item.type}] ${item.reason}`)
  ].join('\n')

  const llmRes = await callGeminiStructured<{ reasons: string[] }>({
    prompt,
    systemInstruction: 'Trả về JSON { "reasons": [...] } với đúng số phần tử đầu vào, tiếng Việt tự nhiên.',
    responseSchema: schema,
    env,
    fetchImpl: options.fetchImpl
  })

  if (!llmRes.ok || !Array.isArray(llmRes.data?.reasons) || llmRes.data.reasons.length !== items.length) {
    return items.map((item) => ({
      ...item,
      reason: deterministicFoxPolish(item)
    }))
  }

  return items.map((item, idx) => ({
    ...item,
    reason: llmRes.data.reasons[idx]?.trim() || deterministicFoxPolish(item)
  }))
}

export function generateMascotDialogue(req: MascotDialogueRequest): MascotDialogueResponse {
  const name = req.userName?.trim() || 'bạn'
  const context = req.contextText?.trim()

  if (req.event === 'USER_CHAT') {
    const lower = (context || '').toLowerCase()
    if (/^(hi|hello|hey|yo|alo|ok|chào|chao|fox ơi|fox oi)/.test(lower) || lower.length < 3) {
      return {
        text: `Chào ${name}! Mình là Fox đây — cần lên lộ trình AI, gợi ý trang phục hay nhắc tiến độ 50% cứ bấm nút AI Studio góc trên nhé!`,
        emotion: 'happy',
        source: 'AI_PIPELINE',
        toneMode: 'deterministic'
      }
    }
    if (/(mua|đồ|trang trí|áo|kính|mũ|stylist|wardrobe)/.test(lower)) {
      return {
        text: `Fox gợi ý bạn thử "Kính Học Giả" (120 Coin) để hoàn thiện trọn bộ 3/3 Học Giả nhé — mở tab Stylist trong AI Studio để xem ngay!`,
        emotion: 'playful',
        source: 'AI_PIPELINE',
        toneMode: 'deterministic'
      }
    }
    if (/(mệt|chán|lười|khó quá|nản)/.test(lower)) {
      return {
        text: `Thở nhẹ một hơi nào ${name}! Chỉ cần làm 1 bước nhỏ 10 phút trước thôi, Fox luôn ngồi cạnh cổ vũ bạn đó!`,
        emotion: 'encouraging',
        source: 'AI_PIPELINE',
        toneMode: 'deterministic'
      }
    }
    return {
      text: `Fox nghe rồi nè ${name}! Nếu muốn biến "${context}" thành nhiệm vụ hay kế hoạch chi tiết, bạn mở AI Studio nhé!`,
      emotion: 'curious',
      source: 'AI_PIPELINE',
      toneMode: 'deterministic'
    }
  }

  if (context) {
    return {
      text: context.length > 155 ? `${context.slice(0, 152)}...` : context,
      emotion: req.emotionHint ?? 'encouraging',
      source: 'AI_PIPELINE',
      toneMode: 'deterministic'
    }
  }

  if (req.event === 'PLAN_GENERATED') {
    return {
      text: `Fox vừa phác thảo xong lộ trình cho ${name} rồi nè — chỉnh nhẹ lại theo ý mình rồi bấm Áp dụng nhé!`,
      emotion: 'happy',
      source: 'AI_PIPELINE',
      toneMode: 'deterministic'
    }
  }

  if (req.event === 'PLAN_APPLIED') {
    return {
      text: `Tuyệt vời ${name}! Hành trình mới đã sẵn sàng trên bảng nhiệm vụ rồi, cùng Fox chinh phục chặng đầu tiên nào!`,
      emotion: 'happy',
      source: 'AI_PIPELINE',
      toneMode: 'deterministic'
    }
  }

  if (typeof req.completedToday === 'number' && typeof req.totalToday === 'number' && req.totalToday > 0) {
    const ratio = req.completedToday / req.totalToday
    if (ratio >= 0.8) {
      return {
        text: `${name} làm được ${req.completedToday}/${req.totalToday} nhiệm vụ rồi, sắp cán đích hôm nay rồi đó!`,
        emotion: 'happy',
        source: 'AI_PIPELINE',
        toneMode: 'deterministic'
      }
    }
    return {
      text: `Hôm nay ${name} xong ${req.completedToday}/${req.totalToday} việc rồi — thử mở AI Studio xem Fox có mẹo chia nhỏ nào không nhé!`,
      emotion: 'encouraging',
      source: 'AI_PIPELINE',
      toneMode: 'deterministic'
    }
  }

  const emotion: DialogueEmotion = req.emotionHint ?? 'encouraging'
  return {
    text: `Chào ${name}! Cần Fox lên lộ trình mới hay tối ưu lịch học hôm nay cứ mở AI Studio nha.`,
    emotion,
    source: 'AI_PIPELINE',
    toneMode: 'deterministic'
  }
}
