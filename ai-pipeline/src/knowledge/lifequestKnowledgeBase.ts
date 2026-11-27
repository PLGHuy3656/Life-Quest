import type { AiPipelineEnv } from '../config/env.js'
import { getGeminiEmbedding } from '../providers/geminiClient.js'

export interface LifeQuestKnowledgeDoc {
  id: string
  topic:
    | 'OVERVIEW_ECONOMY'
    | 'WORK_QUESTS_FOCUS'
    | 'AI_ROADMAP'
    | 'ALARM_WAKEUP'
    | 'PROGRESS_NOTIFICATIONS'
    | 'MASCOT_WARDROBE'
    | 'FRIENDS_SOCIAL'
    | 'SOCIAL_GROUP_STREAK'
    | 'PROOF_JOURNAL_SOCIAL'
    | 'DAILY_REFLECTION'
    | 'PRODUCTIVITY_COACHING'
    | 'AUTH_SECURITY'
  title: string
  /** Concise 1-2 sentence answer (<= 210 chars) used directly for crisp Fox chat replies */
  conciseAnswer: string
  summary: string
  details: string
  keywords: string[]
  relatedEndpoints: string[]
  suggestedActionType?:
    | 'OPEN_ROADMAP_STUDIO'
    | 'OPEN_WARDROBE_STYLIST'
    | 'LAUNCH_ALARM_MINIGAME'
    | 'OPEN_NOTIFICATION_CENTER'
    | 'OPEN_WORK_HUB'
  suggestedActionLabel?: string
}

export const LIFEQUEST_KNOWLEDGE_BASE: LifeQuestKnowledgeDoc[] = [
  {
    id: 'kb-overview-economy',
    topic: 'OVERVIEW_ECONOMY',
    title: 'Tổng quan LifeQuest, XP, Coin & Thăng cấp',
    conciseAnswer:
      'LifeQuest biến việc hằng ngày thành hành trình nhập vai cùng Fox: hoàn thành nhiệm vụ, Focus hoặc báo thức 07:00 để nhận XP lên cấp và Coin mua đồ.',
    summary: 'LifeQuest giúp quản lý mục tiêu theo phong cách nhập vai cùng linh vật Fox 3D.',
    details:
      'Hoàn thành Task/Quest, phiên Focus hoặc báo thức 07:00 sẽ cộng XP tăng Level và Coin để mua trang phục Fox hoặc Streak Freeze.',
    keywords: [
      'lifequest',
      'life quest',
      'xp',
      'coin',
      'tien thuong',
      'level',
      'cap do',
      'thang cap',
      'len cap',
      'fox la ai',
      'gioi thieu'
    ],
    relatedEndpoints: ['GET /v1/capabilities', 'GET /v1/knowledge/documents'],
    suggestedActionType: 'OPEN_ROADMAP_STUDIO',
    suggestedActionLabel: '✨ Mở AI Studio'
  },
  {
    id: 'kb-auth-security',
    topic: 'AUTH_SECURITY',
    title: 'Cơ chế đăng nhập, đăng ký & bảo mật phiên',
    conciseAnswer:
      'LifeQuest đăng nhập bằng Email/Mật khẩu (JWT): accessToken chỉ lưu tạm trong RAM, refreshToken lưu ở sessionStorage theo tab — không ghi token ra localStorage.',
    summary: 'Phiên đăng nhập bảo mật cao trong RAM/sessionStorage, hỗ trợ thêm nút Mock Data trên màn hình Login.',
    details:
      'Người dùng đăng nhập bằng Email và Mật khẩu qua Auth API (JWT), có hỗ trợ khôi phục phiên an toàn qua refresh token trong tab hiện tại hoặc vào nhanh bằng chế độ Mock Data để kiểm thử.',
    keywords: [
      'dang nhap',
      'login',
      'dang ky',
      'register',
      'mat khau',
      'password',
      'quen mat khau',
      'tai khoan',
      'bao mat',
      'token',
      'jwt',
      'session',
      'localstorage',
      'mock data'
    ],
    relatedEndpoints: ['POST /v1/assistant/chat']
  },
  {
    id: 'kb-friends-social',
    topic: 'FRIENDS_SOCIAL',
    title: 'Tính năng kết bạn, bạn bè & bảng tin Social',
    conciseAnswer:
      'Bạn có thể kết bạn để theo dõi hành trình nhau, nhắn tin trực tiếp, rủ làm thử thách chung và chia sẻ ảnh nhiệm vụ đã xác thực (Verified) lên bảng tin Social.',
    summary: 'Kết nối bạn bè để đồng hành mục tiêu, nhắn tin 1-1 và chia sẻ thành tích trên Social Feed.',
    details:
      'Trong LifeQuest, bạn có thể tìm & mời bạn bè tham gia thử thách chung, trò chuyện trực tiếp ở mục Tin nhắn, giữ chuỗi tình bạn và đăng bài khoe ảnh đã xác thực AI lên bảng tin Social.',
    keywords: [
      'ket ban',
      'add friend',
      'ban be',
      'friend',
      'moi ban',
      'theo doi',
      'follow',
      'social',
      'bang tin',
      'chia se ban be',
      'dong hanh'
    ],
    relatedEndpoints: ['POST /v1/proofs/verify']
  },
  {
    id: 'kb-social-group-streak',
    topic: 'SOCIAL_GROUP_STREAK',
    title: 'Nhóm chat, Chuỗi cá nhân & Chuỗi nhóm (Group Streak)',
    conciseAnswer:
      'Hoàn thành ít nhất 1 việc mỗi ngày để giữ chuỗi cá nhân (có thể mua Streak Freeze phòng bận). Chuỗi nhóm yêu cầu tỷ lệ thành viên cùng hoàn thành mỗi ngày.',
    summary: 'Duy trì chuỗi ngày cá nhân và chuỗi nhóm cùng bạn bè qua phòng chat, hỗ trợ Streak Freeze.',
    details:
      'Chuỗi nhóm tính theo chế độ ALL_MEMBERS hoặc THRESHOLD_PERCENT; khi nhóm thiếu người, AI tính chính xác số thành viên còn thiếu để nhắc cứu chuỗi kịp thời.',
    keywords: [
      'chuoi',
      'streak',
      'nhom',
      'group',
      'chat nhom',
      'tin nhan',
      'websocket',
      'freeze',
      'dong bang',
      'rot chuoi',
      'cuu chuoi',
      'thu thach',
      'challenge'
    ],
    relatedEndpoints: ['POST /v1/groups/streak-assist'],
    suggestedActionType: 'OPEN_ROADMAP_STUDIO',
    suggestedActionLabel: '🔥 Mở AI Chuỗi Nhóm'
  },
  {
    id: 'kb-work-quests-focus',
    topic: 'WORK_QUESTS_FOCUS',
    title: 'Mục tiêu (Goal), Nhiệm vụ (Task/Quest), Thói quen & Focus Timer',
    conciseAnswer:
      'Công việc được tổ chức theo Goal → Chặng → Nhiệm vụ (Task/Habit/Quest). Bạn có thể ghim việc quan trọng ra bảng Pin và bật Focus 25 phút để tập trung.',
    summary: 'Quản lý công việc theo cấu trúc Goal -> Milestone -> Quest kèm đồng hồ Focus.',
    details:
      'Hỗ trợ lọc theo Hôm nay/Quá hạn/Sắp tới, đặt mức ưu tiên, ghim việc quan trọng và chạy phiên tập trung Pomodoro 25 phút.',
    keywords: [
      'nhiem vu',
      'task',
      'quest',
      'habit',
      'thoi quen',
      'muc tieu',
      'goal',
      'milestone',
      'focus',
      'pomodoro',
      'tap trung',
      'cong viec',
      'lich',
      'ghim',
      'con may viec'
    ],
    relatedEndpoints: ['POST /v1/recommendations/analyze'],
    suggestedActionType: 'OPEN_WORK_HUB',
    suggestedActionLabel: '✅ Mở bảng Công việc'
  },
  {
    id: 'kb-ai-roadmap',
    topic: 'AI_ROADMAP',
    title: 'Thiết kế & tinh chỉnh Lộ trình AI theo mục tiêu',
    conciseAnswer:
      'Nhập mục tiêu cùng số ngày và thời gian rảnh, AI sẽ tự chia thành các chặng (Milestones), nhiệm vụ hằng ngày kèm khung giờ vàng và XP/Coin dự kiến.',
    summary: 'Tự động lập lộ trình cá nhân hóa từ mục tiêu tự nhiên và cho phép tinh chỉnh lại.',
    details:
      'Roadmap Planner hỗ trợ phân tích mục tiêu (IELTS, ôn thi, chạy bộ, giảm cân...), sinh 3–4 chặng và tinh chỉnh nhẹ nhàng hơn trước khi áp dụng vào lịch.',
    keywords: [
      'lo trinh',
      'ke hoach',
      'roadmap',
      'plan',
      'lap lich',
      'thiet ke lo trinh',
      'ielts',
      'on thi',
      'chay bo',
      'giam can',
      'tinh chinh',
      'refine',
      '30 ngay',
      '14 ngay',
      '7 ngay'
    ],
    relatedEndpoints: ['POST /v1/roadmaps/generate', 'POST /v1/roadmaps/refine'],
    suggestedActionType: 'OPEN_ROADMAP_STUDIO',
    suggestedActionLabel: '🗺️ Tạo Lộ trình AI'
  },
  {
    id: 'kb-alarm-wakeup',
    topic: 'ALARM_WAKEUP',
    title: 'Báo thức Daily 07:00 & Mini-game khởi đầu ngày mới',
    conciseAnswer:
      'Báo thức Daily lúc 07:00 mở 1 mini-game/ngày (xoay vòng 4 loại không trùng hôm qua) để tắt chuông và nhận Bonus XP/Coin; làm xong nút báo thức chuyển từ đỏ sang xanh.',
    summary: 'Nhiệm vụ báo thức 07:00 chơi 1 lần/ngày với 4 mini-game xoay vòng chống chán.',
    details:
      'Gồm 4 mini-game: Chuỗi trí nhớ, Toán tỉnh ngủ, Gõ khẳng định, Chạm nhanh. Hoàn thành giúp tắt chuông, nhận Bonus XP/Coin và khóa tới 07:00 sáng hôm sau.',
    keywords: [
      'bao thuc',
      'alarm',
      '7h',
      '07:00',
      '7 gio',
      'day som',
      'thuc day',
      'khoi dau ngay moi',
      'mini game',
      'minigame',
      'snooze',
      'ngu nuong',
      'tinh ngu',
      'bonus'
    ],
    relatedEndpoints: ['GET /v1/alarms/daily-wakeup', 'POST /v1/alarms/daily-wakeup/complete'],
    suggestedActionType: 'LAUNCH_ALARM_MINIGAME',
    suggestedActionLabel: '⏰ Mở Báo thức 07:00'
  },
  {
    id: 'kb-progress-notifications',
    topic: 'PROGRESS_NOTIFICATIONS',
    title: 'Nhắc tiến độ 50% / 80% / 100% & Quiet Hours (22:00–06:00)',
    conciseAnswer:
      'AI tự động nhắc động viên khi bạn đạt 50%, 80%, 100% tiến độ. Thông báo đẩy tôn trọng giờ yên tĩnh Quiet Hours (22:00–06:00), chỉ cho báo thức khẩn cấp vượt qua.',
    summary: 'Nhắc tiến độ chủ động 50%/80%/100% và lập lịch đẩy FCM chống spam.',
    details:
      'Notification Scheduler hoãn thông báo thường sang sáng hôm sau trong khung 22:00–06:00, tôn trọng Mute phòng chat và gộp chống spam.',
    keywords: [
      'tien do',
      '50%',
      '80%',
      '100%',
      'thong bao',
      'nhac nho',
      'fcm',
      'push',
      'quiet hours',
      'gio yen tinh',
      'gio vang',
      'chong spam'
    ],
    relatedEndpoints: ['POST /v1/progress/evaluate', 'POST /v1/notifications/schedule'],
    suggestedActionType: 'OPEN_NOTIFICATION_CENTER',
    suggestedActionLabel: '🔔 Trung tâm Thông báo'
  },
  {
    id: 'kb-mascot-wardrobe',
    topic: 'MASCOT_WARDROBE',
    title: 'Tủ đồ Fox 3D & AI tư vấn trang phục',
    conciseAnswer:
      'Bạn dùng Coin để mua 18 món đồ thuộc 6 bộ chủ đề cho Fox 3D. AI Stylist ưu tiên gợi ý món hợp ví Coin giúp hoàn thiện trọn bộ 3/3 (như Kính Học Giả 120 Coin).',
    summary: 'Tùy biến Fox 3D với 6 bộ trang phục và AI tư vấn phối đồ theo Coin.',
    details:
      'Wardrobe Stylist phân tích các món bạn đang có, số dư Coin và nhóm nhiệm vụ nổi bật để gợi ý món trang trí phù hợp nhất.',
    keywords: [
      'tu do',
      'wardrobe',
      'trang tri',
      'trang phuc',
      'mua do',
      'stylist',
      'kinh',
      'mu',
      'ao',
      'giay',
      'phu kien',
      'mac gi',
      'bo do',
      'mascot'
    ],
    relatedEndpoints: ['POST /v1/wardrobe/recommendations'],
    suggestedActionType: 'OPEN_WARDROBE_STYLIST',
    suggestedActionLabel: '🛍️ Mở Fox Stylist'
  },
  {
    id: 'kb-proof-journal-social',
    topic: 'PROOF_JOURNAL_SOCIAL',
    title: 'Ảnh xác thực nhiệm vụ (Rubric 4 tiêu chí) & Nhật ký',
    conciseAnswer:
      'Vào chi tiết nhiệm vụ để gửi ảnh xác thực; AI chấm 4 tiêu chí (Liên quan, Chân thực, Nỗ lực, Rõ nét), chống trùng ảnh SHA-256 và thưởng +10 Bonus XP cho ảnh xuất sắc.',
    summary: 'Xác thực ảnh hoàn thành nhiệm vụ bằng AI và lưu vào Nhật ký / Nhóm / Social.',
    details:
      'Sau khi Verified, ngoài danh sách đổi thành huy hiệu "Đã xác thực" để bạn bấm xem lại ảnh bất kỳ lúc nào.',
    keywords: [
      'anh xac thuc',
      'xac thuc anh',
      'minh chung',
      'verify',
      'verified',
      'chup anh',
      'gui anh',
      'nhat ky',
      'journal',
      'rubric',
      'cham diem anh',
      'trung anh'
    ],
    relatedEndpoints: ['POST /v1/proofs/verify'],
    suggestedActionType: 'OPEN_WORK_HUB',
    suggestedActionLabel: '✅ Mở bảng Nhiệm vụ'
  },
  {
    id: 'kb-daily-reflection',
    topic: 'DAILY_REFLECTION',
    title: 'Tổng kết cuối ngày cùng Fox',
    conciseAnswer:
      'Bấm "Tổng kết ngày" trong khung Fox để xem tóm tắt thành quả hôm nay, điểm sáng nổi bật và 1 gợi ý nhẹ nhàng cho sáng mai lúc 07:00.',
    summary: 'Thẻ tổng kết cuối ngày ngắn gọn giúp khép lại ngày mới nhẹ nhàng.',
    details:
      'Daily Reflection tổng hợp số nhiệm vụ xong, số ảnh đã xác thực và chuỗi ngày để khích lệ bạn cuối ngày.',
    keywords: [
      'tong ket',
      'cuoi ngay',
      'recap',
      'reflection',
      'nhin lai',
      'hom nay lam duoc gi',
      'bao cao ngay'
    ],
    relatedEndpoints: ['POST /v1/reflections/daily-summary']
  },
  {
    id: 'kb-productivity-coaching',
    topic: 'PRODUCTIVITY_COACHING',
    title: 'Mẹo chống trì hoãn & giữ tập trung',
    conciseAnswer:
      'Khi quá tải hoặc lười bắt đầu, hãy áp dụng quy tắc 5 phút, chỉ ghim 1–3 việc quan trọng nhất và bật Focus Timer 25 phút để vào guồng ngay.',
    summary: 'Chiến lược chia nhỏ việc lớn, chống trì hoãn và quản lý thời gian hiệu quả.',
    details:
      'Bạn có thể nhờ AI Studio chia nhỏ nhiệm vụ khó thành các bước 15 phút và chuyển việc hay trễ sang khung giờ vàng của bản thân.',
    keywords: [
      'tri hoan',
      'mat tap trung',
      'khong tap trung',
      'chia nho',
      'quan ly thoi gian',
      'lam sao de hoc',
      'bat dau tu dau',
      'qua tai',
      'deadline',
      'bi quyet',
      'ky luat',
      'ngu som'
    ],
    relatedEndpoints: ['POST /v1/recommendations/analyze'],
    suggestedActionType: 'OPEN_ROADMAP_STUDIO',
    suggestedActionLabel: '✨ Mở AI Studio'
  }
]

// Generic Vietnamese filler/meta words must never skew topic matching
const VIETNAMESE_STOPWORDS = new Set([
  'tinh',
  'nang',
  'chuc',
  'co',
  'che',
  'cach',
  'lam',
  'sao',
  'the',
  'nao',
  'ra',
  'nhu',
  'la',
  'gi',
  'cua',
  'cho',
  'voi',
  'trong',
  'ngoai',
  'khi',
  'neu',
  'thi',
  'hay',
  'hoac',
  'mot',
  'hai',
  'toi',
  'ban',
  'minh',
  'khong',
  'duoc',
  'can',
  'muon',
  'hom',
  'nay',
  'mai',
  'bao',
  'nhieu',
  'thoi',
  'vang',
  'gia',
  'sai',
  'gon',
  'ung',
  'dung',
  'app',
  'he',
  'thong'
])

export function normalizeVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9%:\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeMeaningful(norm: string): string[] {
  return norm.split(' ').filter((t) => t.length >= 2 && !VIETNAMESE_STOPWORDS.has(t))
}

// Precompute BM25 corpus stats once at startup
const DOC_TOKENS = LIFEQUEST_KNOWLEDGE_BASE.map((doc) => {
  const fullText = normalizeVietnamese(
    `${doc.title} ${doc.conciseAnswer} ${doc.summary} ${doc.keywords.join(' ')}`
  )
  return tokenizeMeaningful(fullText)
})
const AVG_DOC_LEN =
  DOC_TOKENS.reduce((acc, toks) => acc + toks.length, 0) / Math.max(1, DOC_TOKENS.length)

function computeIdf(term: string): number {
  let df = 0
  for (const toks of DOC_TOKENS) {
    if (toks.includes(term)) df += 1
  }
  return Math.log(1 + (DOC_TOKENS.length - df + 0.5) / (df + 0.5))
}

export interface KnowledgeSearchHit {
  doc: LifeQuestKnowledgeDoc
  score: number
  matchedKeywords: string[]
}

export function searchLifeQuestKnowledge(query: string, topK = 3): KnowledgeSearchHit[] {
  const normalizedQuery = normalizeVietnamese(query)
  if (!normalizedQuery) return []

  const queryTokens = tokenizeMeaningful(normalizedQuery)
  const hits: KnowledgeSearchHit[] = []
  const k1 = 1.4
  const b = 0.75

  LIFEQUEST_KNOWLEDGE_BASE.forEach((doc, idx) => {
    let score = 0
    const matchedKeywords: string[] = []

    // 1. Exact phrase / keyword boost (highest precision for domain concepts)
    for (const kw of doc.keywords) {
      const normKw = normalizeVietnamese(kw)
      if (!normKw) continue
      const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i').test(normalizedQuery)) {
        score += normKw.includes(' ') ? 8 : 4.5
        matchedKeywords.push(kw)
      }
    }

    // 2. BM25 lexical scoring over meaningful non-stopword tokens
    const docToks = DOC_TOKENS[idx]
    const docLen = Math.max(1, docToks.length)
    for (const qTerm of queryTokens) {
      const tf = docToks.filter((t) => t === qTerm).length
      if (tf > 0) {
        const idf = computeIdf(qTerm)
        const bm25 = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / AVG_DOC_LEN))))
        score += bm25
      }
    }

    if (matchedKeywords.length > 0 || score >= 3.2) {
      hits.push({ doc, score: Number(score.toFixed(2)), matchedKeywords })
    }
  })

  return hits.sort((a, b) => b.score - a.score).slice(0, topK)
}

// In-memory vector cache for Gemini Embedding Hybrid Search (auto-populates when AI_API_KEY is present)
const docEmbeddingCache = new Map<string, number[]>()

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

export async function searchLifeQuestKnowledgeHybrid(
  query: string,
  options: { topK?: number; env?: AiPipelineEnv; fetchImpl?: typeof fetch } = {}
): Promise<KnowledgeSearchHit[]> {
  const topK = options.topK ?? 3
  const bm25Hits = searchLifeQuestKnowledge(query, LIFEQUEST_KNOWLEDGE_BASE.length)
  if (!options.env?.aiApiKey) {
    return bm25Hits.slice(0, topK)
  }

  const queryVec = await getGeminiEmbedding(query, {
    env: options.env,
    fetchImpl: options.fetchImpl
  })
  if (!queryVec) {
    return bm25Hits.slice(0, topK)
  }

  const bm25Map = new Map(bm25Hits.map((h) => [h.doc.id, h]))
  const maxBm25 = bm25Hits[0]?.score || 1
  const combined: KnowledgeSearchHit[] = []

  for (const doc of LIFEQUEST_KNOWLEDGE_BASE) {
    let docVec = docEmbeddingCache.get(doc.id)
    if (!docVec) {
      const emb = await getGeminiEmbedding(`${doc.title}. ${doc.conciseAnswer}`, {
        env: options.env,
        fetchImpl: options.fetchImpl
      })
      if (emb) {
        docEmbeddingCache.set(doc.id, emb)
        docVec = emb
      }
    }
    const vecSim = docVec ? cosineSimilarity(queryVec, docVec) : 0
    const bm25Hit = bm25Map.get(doc.id)
    const normBm25 = bm25Hit ? bm25Hit.score / maxBm25 : 0
    const hybridScore = Number((vecSim * 0.65 + normBm25 * 0.35).toFixed(3))

    if (hybridScore >= 0.48 || (bm25Hit && bm25Hit.matchedKeywords.length > 0)) {
      combined.push({
        doc,
        score: Number((hybridScore * 10).toFixed(2)),
        matchedKeywords: bm25Hit?.matchedKeywords ?? []
      })
    }
  }

  return combined.sort((a, b) => b.score - a.score).slice(0, topK)
}
