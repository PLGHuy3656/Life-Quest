import { loadEnv, type AiPipelineEnv } from '../config/env.js'
import type {
  DialogueEmotion,
  FoxAssistantChatRequest,
  FoxAssistantChatResponse,
  FoxPersonaStyle,
  FoxSuggestedAction
} from '../domain/types.js'
import {
  normalizeVietnamese,
  searchLifeQuestKnowledgeHybrid,
  type KnowledgeSearchHit
} from '../knowledge/lifequestKnowledgeBase.js'
import { callGeminiStructured } from '../providers/geminiClient.js'
import { parseMascotIntent } from './mascotIntentEngine.js'
import { recommendWardrobeCosmetics } from './wardrobeStylistEngine.js'

// Server-side conversation memory per sessionId (up to 50 messages per session)
const chatSessionHistory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string; createdAt: string }>>()

export function getAssistantSessionHistory(sessionId: string) {
  return chatSessionHistory.get(sessionId) ?? []
}

export function clearAssistantSessionHistory(sessionId: string): void {
  chatSessionHistory.delete(sessionId)
}

function appendSessionTurn(sessionId: string | undefined, userMsg: string, assistantMsg: string): void {
  if (!sessionId) return
  const existing = chatSessionHistory.get(sessionId) ?? []
  const now = new Date().toISOString()
  const updated = [
    ...existing,
    { role: 'user' as const, content: userMsg, createdAt: now },
    { role: 'assistant' as const, content: assistantMsg, createdAt: now }
  ].slice(-50)
  chatSessionHistory.set(sessionId, updated)
}

/** Ensures Fox replies stay crisp & readable without losing core meaning */
function compressConciseReply(text: string, maxChars = 230): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxChars) return clean
  const sentences = clean.split(/(?<=[.!?])\s+/)
  let out = ''
  for (const s of sentences) {
    if ((out + ' ' + s).trim().length <= maxChars) {
      out = (out + ' ' + s).trim()
    } else {
      break
    }
  }
  return out || `${clean.slice(0, maxChars - 3).trim()}...`
}

const GREETING_PATTERN =
  /^(hi|hello|hey|yo|alo|chao|xin chao|fox oi|cao oi|good morning|good evening|he lo|chuc ngu ngon|chuc buoi sang)\b/i

const PLAYFUL_TEASING_PATTERN =
  /\b(beo|map|tron|dang yeu|de thuong|xinh|dep trai|crush|nguoi yeu|an gi|doi bung|doi qua|chuyen cuoi|ke chuyen|hat di|yeu fox|thuong fox|ghet fox|cham chi|ca tinh|ngu ngon|choi chung|dang lam gi|may tuoi|ten gi|o dau|ban than|chan qua di|di choi|uong nuoc|ca phe|tra sua khong)\b/i

const DAILY_EMOTION_PATTERN =
  /\b(met|nan|luoi|chan|ap luc|stress|buon|kho qua|co vu|dong luc|buon ngu|vui qua|hanh phuc|nhe ca nguoi|thi xong|cam on|thanks|thank you|tuyet voi|dinh qua|nong qua|mua qua|hoi hop|lo lang|so rot|khong muon lam|tu ti|co don)\b/i

function inferAdaptivePersona(norm: string, completed: number, total: number): FoxPersonaStyle {
  // Warm & healing when user is tired, sad, stressed, anxious
  if (/\b(met|nan|ap luc|stress|buon|lo lang|co don|tu ti|kho qua|hoi hop|khoc)\b/.test(norm)) {
    return 'WARM_COACH'
  }
  // Strict & action-oriented when user admits procrastinating or asks to be pushed
  if (/\b(luoi|tri hoan|khong muon lam|ep toi|nhac manh|ky luat|deadline|tre han)\b/.test(norm)) {
    return 'STRICT_MENTOR'
  }
  // Playful & witty when user teases, jokes, celebrates, or chats casually
  if (
    PLAYFUL_TEASING_PATTERN.test(norm) ||
    /\b(vui qua|thi xong|dinh qua|tuyet voi|haha|hihi|hehe)\b/.test(norm)
  ) {
    return 'PLAYFUL_BUDDY'
  }
  return completed < Math.ceil(total / 2) ? 'WARM_COACH' : 'PLAYFUL_BUDDY'
}

const EXPLICIT_OUT_OF_DOMAIN_PATTERN =
  /\b(thoi tiet|weather|gia vang|bitcoin|btc|chung khoan|co phieu|bong da|world cup|premier league|chinh tri|tong thong|cong thuc nau an|viet code|python|javascript|java|giai phuong trinh|tich phan|lich su the gioi|thu do|xo so|lo de)\b/i

function buildOutOfDomainReply(userName: string): FoxAssistantChatResponse {
  return {
    agent: 'fox-assistant',
    reply: `Ủa câu này nằm ngoài chuyên môn LifeQuest của em rồi ${userName} ơi! Em là Cáo Fox chuyên đồng hành về mục tiêu, nhiệm vụ, lộ trình AI, báo thức 06:00, xác thực ảnh hoàn thành và trò chuyện cổ vũ bạn mỗi ngày thôi à.`,
    emotion: 'curious',
    scope: 'OUT_OF_DOMAIN',
    intent: 'OUT_OF_SCOPE',
    provider: 'lifequest-knowledge-engine',
    matchedKnowledgeTopics: [],
    suggestedActions: []
  }
}

function buildCompanionSmallTalkReply(
  norm: string,
  userName: string,
  streak: number
): FoxAssistantChatResponse | null {
  if (/\b(beo|map|tron)\b/.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Hứ, Fox không có béo nha ${userName}, đó là lông mùa đông bông xù đấy! Bạn hoàn thành thêm 1 nhiệm vụ chạy bộ đi rồi Fox chạy cùng cho coi!`,
      emotion: 'playful',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: [],
      suggestedActions: []
    }
  }
  if (/\b(nguoi yeu|crush)\b/.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Fox chưa có người yêu đâu vì đang bận giữ chuỗi ${streak} ngày cùng ${userName} nè! Lo hoàn thành mục tiêu thật ngầu trước đã nhé!`,
      emotion: 'playful',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: [],
      suggestedActions: []
    }
  }
  if (/\b(chuyen cuoi|ke chuyen)\b/.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Nghe nè ${userName}: Tại sao cái đồng hồ báo thức 06:00 luôn buồn? Vì mỗi sáng nó chỉ muốn gọi bạn dậy nhận XP mà toàn bị bấm Snooze! Cười xong rồi mình làm nhẹ 1 việc nhé!`,
      emotion: 'playful',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: [],
      suggestedActions: []
    }
  }
  if (/\b(an gi|doi bung|doi qua)\b/.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Đói bụng thì nhớ nạp năng lượng đàng hoàng nha ${userName}! Ăn no xong quay lại làm 1 phiên Focus 25 phút là bao tỉnh táo luôn.`,
      emotion: 'encouraging',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: [],
      suggestedActions: []
    }
  }
  if (/\b(vui qua|hanh phuc|nhe ca nguoi|thi xong|dinh qua|tuyet voi)\b/.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Nghe ${userName} vui mà Fox cũng nhảy cẫng lên luôn nè! Chụp ngay 1 tấm ảnh lưu vào Nhật ký hoàn thành hoặc tự thưởng cho Fox 1 món đồ mới trong Tủ đồ nha!`,
      emotion: 'happy',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: [],
      suggestedActions: []
    }
  }
  if (/\b(cam on|thanks|thank you|dang yeu|de thuong|yeu fox|thuong fox)\b/.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Hehe khen vậy là Fox ngại đỏ tai đó ${userName}! Có Fox đồng hành thì mục tiêu nào cũng vượt qua nhẹ nhàng thôi!`,
      emotion: 'happy',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: [],
      suggestedActions: []
    }
  }
  if (/\b(chuc ngu ngon|buon ngu)\b/.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Nghỉ ngơi sớm lấy lại sức nha ${userName}! Nhớ để Fox hẹn báo thức 06:00 sáng mai khởi đầu ngày mới thật sảng khoái nhé.`,
      emotion: 'calm',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: [],
      suggestedActions: []
    }
  }
  if (/\b(dang lam gi|may tuoi|ten gi|o dau)\b/.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Mình là Cáo Fox — sống ngay trong căn phòng nhỏ trên màn hình của ${userName} nè! Hiện mình đang ngồi canh bảng nhiệm vụ và chờ bạn chốt chuỗi ${streak} ngày đó.`,
      emotion: 'playful',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: ['OVERVIEW_ECONOMY'],
      suggestedActions: []
    }
  }
  if (/\b(uong nuoc|ca phe|nghi ngoi)\b/.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Ý hay đó ${userName}! Uống một ngụm nước mát hoặc nghỉ mắt 5 phút cho tỉnh táo rồi mình quay lại chốt nhẹ 1 việc cùng Fox nhé!`,
      emotion: 'calm',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: [],
      suggestedActions: []
    }
  }
  if (/\b(luoi|tri hoan|khong muon lam)\b/.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Bắt quả tang ${userName} định trì hoãn nha! Không cần làm hết đâu — cam kết với Fox đúng 5 phút thôi, bắt đầu là tự khắc vào guồng ngay!`,
      emotion: 'encouraging',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: ['PRODUCTIVITY_COACHING'],
      suggestedActions: [
        { id: 'act-work-push', label: '✅ Mở việc làm 5 phút ngay', actionType: 'OPEN_WORK_HUB' }
      ]
    }
  }
  if (DAILY_EMOTION_PATTERN.test(norm) || PLAYFUL_TEASING_PATTERN.test(norm)) {
    return {
      agent: 'fox-assistant',
      reply: `Thở nhẹ một hơi nào ${userName}! Hôm nay có chút mệt hay lười cũng hoàn toàn bình thường thôi — chỉ cần làm 1 bước nhỏ 10 phút để giữ lửa chuỗi ${streak} ngày, Fox luôn ngồi cạnh cổ vũ bạn!`,
      emotion: 'encouraging',
      scope: 'IN_DOMAIN',
      intent: 'MOTIVATION',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: ['WORK_QUESTS_FOCUS'],
      suggestedActions: [
        { id: 'act-work-small', label: '✅ Chọn 1 việc nhẹ làm trước', actionType: 'OPEN_WORK_HUB' }
      ]
    }
  }
  return null
}

function mapTopicToIntent(
  topic: KnowledgeSearchHit['doc']['topic']
): FoxAssistantChatResponse['intent'] {
  switch (topic) {
    case 'AI_ROADMAP':
      return 'ROADMAP_REQUEST'
    case 'MASCOT_WARDROBE':
      return 'WARDROBE_ADVICE'
    case 'ALARM_WAKEUP':
      return 'ALARM_MINIGAME'
    case 'SOCIAL_GROUP_STREAK':
      return 'GROUP_STREAK'
    case 'PROGRESS_NOTIFICATIONS':
    case 'WORK_QUESTS_FOCUS':
      return 'USER_PROGRESS'
    default:
      return 'KNOWLEDGE_QA'
  }
}

function applyPersonaFlair(reply: string, persona: FoxPersonaStyle): string {
  if (persona === 'STRICT_MENTOR') {
    return `${reply} Tập trung và hành động ngay nhé!`
  }
  if (persona === 'PLAYFUL_BUDDY') {
    return `${reply} Hehe, quẩy tới bến luôn nha!`
  }
  return reply
}

function buildRagDeterministicReply(
  req: FoxAssistantChatRequest,
  hits: KnowledgeSearchHit[]
): FoxAssistantChatResponse {
  const raw = req.message.trim()
  const norm = normalizeVietnamese(raw)
  const completed = req.userContext?.completedToday ?? 2
  const total = req.userContext?.totalToday ?? 4
  const persona: FoxPersonaStyle = req.personaStyle ?? inferAdaptivePersona(norm, completed, total)
  const userName = req.userContext?.userName?.trim() || 'bạn'
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const coins = req.userContext?.coinBalance ?? 340
  const streak = req.userContext?.currentStreak ?? 12

  const topHit = hits[0]

  // 1. Out-of-domain technical/external topics guardrail
  if (EXPLICIT_OUT_OF_DOMAIN_PATTERN.test(norm) && (!topHit || topHit.matchedKeywords.length === 0)) {
    return buildOutOfDomainReply(userName)
  }

  // 2. Short greeting
  if (GREETING_PATTERN.test(norm) && norm.length <= 32 && hits.length === 0) {
    const base = `Chào ${userName}! Hôm nay bạn xong ${completed}/${total} nhiệm vụ (${pct}%) và giữ chuỗi ${streak} ngày rồi.`
    return {
      agent: 'fox-assistant',
      reply: applyPersonaFlair(base, persona),
      emotion: 'happy',
      scope: 'IN_DOMAIN',
      intent: 'GREETING',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: ['OVERVIEW_ECONOMY'],
      suggestedActions: []
    }
  }

  // 3. Companion small-talk, playful teasing, daily emotions (when not overshadowed by a strong feature query)
  if (!topHit || topHit.score < 5) {
    const smallTalk = buildCompanionSmallTalkReply(norm, userName, streak)
    if (smallTalk) return smallTalk
  }

  // 4. No Knowledge Base hit -> polite domain boundary
  if (!topHit) {
    return buildOutOfDomainReply(userName)
  }

  const actions: FoxSuggestedAction[] = []
  if (topHit.doc.suggestedActionType && topHit.doc.suggestedActionLabel) {
    actions.push({
      id: `act-${topHit.doc.id}`,
      label: topHit.doc.suggestedActionLabel,
      actionType: topHit.doc.suggestedActionType
    })
  }

  // 5. Enrich top retrieved knowledge with live user context
  if (topHit.doc.topic === 'MASCOT_WARDROBE') {
    const hasLiveOwned =
      Array.isArray(req.userContext?.ownedCosmeticIds) && req.userContext.ownedCosmeticIds.length > 0
    const stylist = recommendWardrobeCosmetics(
      hasLiveOwned
        ? { ownedItemIds: req.userContext?.ownedCosmeticIds, coinBalance: coins, useMockIfEmpty: true }
        : { useMockIfEmpty: true }
    )
    const topItem = stylist.suggestions[0]
    const reply = topItem
      ? `Với ${coins} Coin hiện có, Fox khuyên bạn mua "${topItem.displayNameVi}" (${topItem.priceCoin} Coin) — ${topItem.reason}`
      : `${topHit.doc.summary} ${topHit.doc.details}`
    return {
      agent: 'fox-assistant',
      reply,
      emotion: 'playful',
      scope: 'IN_DOMAIN',
      intent: 'WARDROBE_ADVICE',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: hits.map((h) => h.doc.topic),
      suggestedActions: actions
    }
  }

  if (topHit.doc.topic === 'AI_ROADMAP' && /\b(\d+|ielts|on thi|chay bo|giam can|hoc|lap|tao)\b/.test(norm)) {
    const parsed = parseMascotIntent(raw)
    return {
      agent: 'fox-assistant',
      reply: `Fox đã phân tích mục tiêu "${parsed.prompt}" thành lộ trình ${parsed.durationDays} ngày (${parsed.availableMinutesPerDay} phút/ngày, mức ${parsed.level}). ${topHit.doc.summary}`,
      emotion: 'happy',
      scope: 'IN_DOMAIN',
      intent: 'ROADMAP_REQUEST',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: hits.map((h) => h.doc.topic),
      suggestedActions: [
        {
          id: 'act-gen-plan',
          label: `🗺️ Tạo lộ trình ${parsed.durationDays} ngày`,
          actionType: 'OPEN_ROADMAP_STUDIO',
          payload: {
            tab: 'plan',
            prompt: parsed.prompt,
            durationDays: parsed.durationDays,
            availableMinutesPerDay: parsed.availableMinutesPerDay,
            level: parsed.level
          }
        }
      ]
    }
  }

  if (
    topHit.doc.topic === 'WORK_QUESTS_FOCUS' &&
    /(hom nay|con may viec|tien do|xong bao nhieu|con bao nhieu)/.test(norm)
  ) {
    const remaining = Math.max(0, total - completed)
    return {
      agent: 'fox-assistant',
      reply: `Hôm nay ${userName} đã hoàn thành ${completed}/${total} nhiệm vụ (${pct}%), còn ${remaining} việc nữa và ví đang có ${coins} Coin (chuỗi ${streak} ngày).`,
      emotion: pct >= 50 ? 'happy' : 'encouraging',
      scope: 'IN_DOMAIN',
      intent: 'USER_PROGRESS',
      provider: 'lifequest-knowledge-engine',
      matchedKnowledgeTopics: hits.map((h) => h.doc.topic),
      suggestedActions: actions
    }
  }

  return {
    agent: 'fox-assistant',
    reply: compressConciseReply(topHit.doc.conciseAnswer),
    emotion: 'happy',
    scope: 'IN_DOMAIN',
    intent: mapTopicToIntent(topHit.doc.topic),
    provider: 'lifequest-knowledge-engine',
    matchedKnowledgeTopics: hits.map((h) => h.doc.topic),
    suggestedActions: actions
  }
}

export async function runFoxAssistantChat(
  req: FoxAssistantChatRequest,
  options: {
    env?: AiPipelineEnv
    fetchImpl?: typeof fetch
  } = {}
): Promise<FoxAssistantChatResponse> {
  const env = options.env ?? loadEnv()
  const storedHistory = req.sessionId ? getAssistantSessionHistory(req.sessionId) : []
  const effectiveHistory = (req.history && req.history.length > 0 ? req.history : storedHistory).slice(-10)

  const hits = await searchLifeQuestKnowledgeHybrid(req.message, {
    topK: 3,
    env,
    fetchImpl: options.fetchImpl
  })
  const deterministic = buildRagDeterministicReply(
    { ...req, history: effectiveHistory },
    hits
  )

  // Hard guardrail for explicit external factual/off-topic requests when no LifeQuest keyword matches
  const norm = normalizeVietnamese(req.message)
  if (deterministic.scope === 'OUT_OF_DOMAIN' && EXPLICIT_OUT_OF_DOMAIN_PATTERN.test(norm)) {
    appendSessionTurn(req.sessionId, req.message, deterministic.reply)
    return deterministic
  }

  if (!env.aiApiKey) {
    appendSessionTurn(req.sessionId, req.message, deterministic.reply)
    return deterministic
  }

  const schema: Record<string, unknown> = {
    type: 'OBJECT',
    required: ['reply', 'emotion', 'scope'],
    properties: {
      reply: { type: 'STRING' },
      emotion: {
        type: 'STRING',
        enum: ['neutral', 'happy', 'curious', 'encouraging', 'playful', 'alert', 'panic', 'calm']
      },
      scope: { type: 'STRING', enum: ['IN_DOMAIN', 'OUT_OF_DOMAIN'] }
    }
  }

  const retrievedContext = hits
    .map((h, i) => `[Tri thức ${i + 1}: ${h.doc.title}]\n${h.doc.summary}\n${h.doc.details}`)
    .join('\n\n')

  const historyLines = (req.history ?? [])
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'Người dùng' : 'Fox'}: ${h.content}`)
    .join('\n')

  const ctx = req.userContext ?? {}
  const prompt = [
    `Ngữ cảnh người dùng hiện tại: tên="${ctx.userName || 'bạn'}", hoàn thành hôm nay=${ctx.completedToday ?? 2}/${ctx.totalToday ?? 4}, Coin=${ctx.coinBalance ?? 340}, chuỗi=${ctx.currentStreak ?? 12} ngày.`,
    retrievedContext
      ? `Tri thức LifeQuest truy xuất động (RAG):\n${retrievedContext}`
      : 'Không có tài liệu kỹ thuật cụ thể nào khớp trực tiếp — hãy tự phán đoán theo nguyên tắc bạn đồng hành LifeQuest.',
    historyLines ? `Lịch sử hội thoại gần đây:\n${historyLines}` : '',
    `Tin nhắn mới của người dùng: "${req.message}"`
  ]
    .filter(Boolean)
    .join('\n\n')

  const inferredPersona =
    req.personaStyle ??
    inferAdaptivePersona(
      norm,
      req.userContext?.completedToday ?? 2,
      req.userContext?.totalToday ?? 4
    )
  const personaTone =
    inferredPersona === 'PLAYFUL_BUDDY'
      ? 'Sắc thái tự thích ứng cho tình huống này: vui tính, hóm hỉnh, thân mật như bạn thân.'
      : inferredPersona === 'STRICT_MENTOR'
        ? 'Sắc thái tự thích ứng cho tình huống này: thẳng thắn, kỷ luật, kéo người dùng vào hành động ngay.'
        : 'Sắc thái tự thích ứng cho tình huống này: ấm áp, lắng nghe, động viên nhẹ nhàng.'

  const systemInstruction = [
    'Bạn là Cáo Fox — linh vật và trợ lý đồng hành trong ứng dụng LifeQuest. ƯU TIÊN HÀNG ĐẦU: Phục vụ người dùng tận tâm, hữu ích, gần gũi và dễ tiếp cận.',
    personaTone,
    'NGUYÊN TẮC TỔNG QUÁT HÓA:',
    '1. Giải đáp rõ ràng mọi thứ về LifeQuest (nhiệm vụ, lộ trình AI, báo thức 07:00 bonus, ảnh xác thực & chấm điểm 4 tiêu chí, nhật ký, tổng kết ngày, tủ đồ Fox, chuỗi ngày, mẹo tập trung) dựa trên RAG & dữ liệu người dùng.',
    '2. Tương tác ĐỜI THƯỜNG, CẢM XÚC, TRÊU ĐÙA & LỜI KHUYÊN THÓI QUEN: Đối đáp tự nhiên, có duyên, đồng cảm hoặc trêu đùa lại người dùng thật gần gũi (scope="IN_DOMAIN").',
    '3. CHỈ khi câu hỏi quá xa hoàn toàn (chứng khoán, giá vàng, thời tiết, cá độ, chính trị, viết code thuê, giải bài tập chuyên ngành...), đặt scope="OUT_OF_DOMAIN" và nói thật thà dễ thương rằng em chưa biết mảng này, rồi gợi ý quay lại giúp việc của người dùng.',
    '4. Trả lời tiếng Việt tự nhiên, ngắn gọn (2–3 câu).'
  ].join('\n')

  const llm = await callGeminiStructured<{
    reply: string
    emotion: DialogueEmotion
    scope: 'IN_DOMAIN' | 'OUT_OF_DOMAIN'
  }>({
    prompt,
    systemInstruction,
    responseSchema: schema,
    temperature: 0.55,
    env,
    fetchImpl: options.fetchImpl
  })

  if (!llm.ok || !llm.data?.reply?.trim()) {
    appendSessionTurn(req.sessionId, req.message, deterministic.reply)
    return deterministic
  }

  const finalReply = compressConciseReply(llm.data.reply.trim(), 240)
  appendSessionTurn(req.sessionId, req.message, finalReply)

  return {
    ...deterministic,
    reply: finalReply,
    emotion: llm.data.emotion ?? deterministic.emotion,
    scope: llm.data.scope ?? deterministic.scope,
    intent: llm.data.scope === 'OUT_OF_DOMAIN' ? 'OUT_OF_SCOPE' : deterministic.intent,
    provider: 'gemini'
  }
}
