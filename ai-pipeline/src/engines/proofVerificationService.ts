import { createHash } from 'node:crypto'
import { loadEnv, type AiPipelineEnv } from '../config/env.js'
import type {
  ProofQualityRubric,
  ProofVerdict,
  ProofVerificationRequest,
  ProofVerificationResponse
} from '../domain/types.js'
import { normalizeVietnamese } from '../knowledge/lifequestKnowledgeBase.js'
import { callGeminiStructured } from '../providers/geminiClient.js'

const UNRELATED_PROOF_SIGNALS = [
  'tra sua',
  'milk tea',
  'game',
  'lien quan',
  'valorant',
  'pubg',
  'meme',
  'selfie',
  'ngu nuong',
  'netflix',
  'phim',
  'nhau',
  'bia',
  'random',
  'unrelated',
  'khong lien quan'
]

// Track verified image hashes per user to detect duplicate photo reuse across different quests
const verifiedHashesByUser = new Map<string, Map<string, string>>()

export function resetProofHashRegistry(): void {
  verifiedHashesByUser.clear()
}

function stripDataUrlPrefix(raw: string): string {
  const commaIdx = raw.indexOf(',')
  if (raw.startsWith('data:') && commaIdx !== -1) {
    return raw.slice(commaIdx + 1).trim()
  }
  return raw.trim()
}

function computeImageSha256(base64Data: string): string {
  return createHash('sha256').update(base64Data).digest('hex')
}

function checkDuplicateHash(userId: string, questId: string, hash: string): boolean {
  const userMap = verifiedHashesByUser.get(userId)
  if (!userMap) return false
  const existingQuestId = userMap.get(hash)
  return Boolean(existingQuestId && existingQuestId !== questId)
}

function rememberVerifiedHash(userId: string, questId: string, hash: string): void {
  let userMap = verifiedHashesByUser.get(userId)
  if (!userMap) {
    userMap = new Map<string, string>()
    verifiedHashesByUser.set(userId, userMap)
  }
  userMap.set(hash, questId)
}

function clamp100(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)))
}

function computeOverallRubric(
  relevanceScore: number,
  authenticityScore: number,
  effortScore: number,
  clarityScore: number
): ProofQualityRubric {
  const rel = clamp100(relevanceScore)
  const auth = clamp100(authenticityScore)
  const eff = clamp100(effortScore)
  const cla = clamp100(clarityScore)
  const overallScore = clamp100(rel * 0.4 + auth * 0.25 + eff * 0.2 + cla * 0.15)
  return {
    relevanceScore: rel,
    authenticityScore: auth,
    effortScore: eff,
    clarityScore: cla,
    overallScore
  }
}

function buildFallbackProofResult(
  req: ProofVerificationRequest,
  imageSha256: string,
  duplicateDetected: boolean
): ProofVerificationResponse {
  if (duplicateDetected) {
    const rubric = computeOverallRubric(25, 10, 20, 75)
    return {
      questId: req.questId,
      verified: false,
      verdict: 'REJECTED',
      qualityBadge: 'REJECTED',
      confidenceScore: 0.2,
      bonusXp: 0,
      duplicateDetected: true,
      imageSha256,
      qualityRubric: rubric,
      detectedObjects: ['ảnh trùng lặp với nhiệm vụ trước'],
      reason: 'Ảnh này đã được sử dụng cho một nhiệm vụ khác trước đó. Hãy chụp ảnh mới để xác thực.',
      foxReaction: 'Ơ kìa, ảnh này Fox thấy quen quen rồi nha! Chụp tấm mới tinh cho nhiệm vụ này giúp Fox nhé!',
      suggestedCaption: '',
      recommendedShareTargets: [],
      provider: 'semantic-fallback'
    }
  }

  const cleanQuest = normalizeVietnamese(`${req.questTitle} ${req.questDescription ?? ''}`)
  const cleanEvidence = normalizeVietnamese(`${req.fileName ?? ''} ${req.userNote ?? ''}`)

  const questTokens = new Set(cleanQuest.split(' ').filter((t) => t.length >= 3))
  const evidenceTokens = cleanEvidence.split(' ').filter((t) => t.length >= 3)

  const hasUnrelatedSignal = UNRELATED_PROOF_SIGNALS.some((sig) => cleanEvidence.includes(sig))
  const overlapTokens = evidenceTokens.filter((t) => questTokens.has(t))

  let rubric = computeOverallRubric(
    overlapTokens.length > 0 ? Math.min(96, 84 + overlapTokens.length * 4) : 84,
    88,
    req.userNote && req.userNote.trim().length >= 8 ? 88 : 80,
    req.imageBase64.length >= 256 ? 86 : 72
  )
  let verdict: ProofVerdict = 'APPROVED'
  let reason = `Ảnh xác thực khớp tốt với nhiệm vụ "${req.questTitle}".`
  let foxReaction = `Tuyệt vời! Fox xác nhận hoàn thành "${req.questTitle}" — chọn lưu Nhật ký hoặc chia sẻ nhé!`
  const detectedObjects =
    overlapTokens.length > 0
      ? overlapTokens.slice(0, 4)
      : ['ảnh hoạt động hợp lệ', req.questTitle.slice(0, 32)]

  if (hasUnrelatedSignal && overlapTokens.length === 0) {
    rubric = computeOverallRubric(22, 65, 25, 78)
    verdict = 'REJECTED'
    reason = `Ảnh chưa liên quan trực tiếp đến "${req.questTitle}". Hãy chụp đúng hoạt động thực tế.`
    foxReaction = `Ảnh này hơi lệch pha với "${req.questTitle}" rồi — chụp lại đúng khoảnh khắc hoàn thành giúp Fox nhé!`
  } else if (req.imageBase64.length < 64) {
    rubric = computeOverallRubric(60, 70, 55, 42)
    verdict = 'NEEDS_REVIEW'
    reason = `Ảnh hơi nhỏ/mờ nên chưa đủ chắc chắn cho "${req.questTitle}". Hãy chụp rõ hơn một chút.`
    foxReaction = `Ảnh hơi mờ nè — chụp rõ hơn hoặc thêm ghi chú ngắn để Fox duyệt ngay nha!`
  }

  const verified = verdict === 'APPROVED'
  const isExcellent = verified && rubric.overallScore >= 85
  const bonusXp = isExcellent ? 10 : 0

  if (verified) {
    rememberVerifiedHash(req.userId || 'demo-user', req.questId, imageSha256)
  }

  return {
    questId: req.questId,
    verified,
    verdict,
    qualityBadge: isExcellent ? 'EXCELLENT' : verified ? 'VERIFIED' : verdict === 'NEEDS_REVIEW' ? 'NEEDS_RETRY' : 'REJECTED',
    confidenceScore: Number((rubric.overallScore / 100).toFixed(2)),
    bonusXp,
    duplicateDetected: false,
    imageSha256,
    qualityRubric: rubric,
    detectedObjects,
    reason,
    foxReaction: isExcellent
      ? `${foxReaction} (Ảnh xuất sắc: +${bonusXp} Bonus XP ⭐)`
      : foxReaction,
    suggestedCaption: `Vừa hoàn thành "${req.questTitle}" cùng Fox trên LifeQuest ✅🦊`,
    recommendedShareTargets: verified ? ['PRIVATE_JOURNAL', 'GROUP_CHAT', 'SOCIAL_FEED'] : [],
    provider: 'semantic-fallback'
  }
}

export async function verifyTaskCompletionProof(
  req: ProofVerificationRequest,
  options: {
    env?: AiPipelineEnv
    fetchImpl?: typeof fetch
  } = {}
): Promise<ProofVerificationResponse> {
  const env = options.env ?? loadEnv()
  const base64Data = stripDataUrlPrefix(req.imageBase64)
  const imageSha256 = computeImageSha256(base64Data)
  const userId = req.userId || 'demo-user'
  const duplicateDetected = checkDuplicateHash(userId, req.questId, imageSha256)

  if (duplicateDetected || !env.aiApiKey) {
    return buildFallbackProofResult({ ...req, userId, imageBase64: base64Data }, imageSha256, duplicateDetected)
  }

  const schema: Record<string, unknown> = {
    type: 'OBJECT',
    required: [
      'verdict',
      'relevanceScore',
      'authenticityScore',
      'effortScore',
      'clarityScore',
      'detectedObjects',
      'reason',
      'foxReaction',
      'suggestedCaption'
    ],
    properties: {
      verdict: { type: 'STRING', enum: ['APPROVED', 'NEEDS_REVIEW', 'REJECTED'] },
      relevanceScore: { type: 'NUMBER' },
      authenticityScore: { type: 'NUMBER' },
      effortScore: { type: 'NUMBER' },
      clarityScore: { type: 'NUMBER' },
      detectedObjects: { type: 'ARRAY', items: { type: 'STRING' } },
      reason: { type: 'STRING' },
      foxReaction: { type: 'STRING' },
      suggestedCaption: { type: 'STRING' }
    }
  }

  const prompt = [
    `Nhiệm vụ: "${req.questTitle}"`,
    req.questDescription ? `Mô tả: "${req.questDescription}"` : '',
    req.userNote ? `Ghi chú người dùng: "${req.userNote}"` : '',
    'Đánh giá hình ảnh đính kèm theo 4 tiêu chí (0..100): relevanceScore (độ khớp nhiệm vụ), authenticityScore (ảnh thật tự chụp), effortScore (mức độ nỗ lực/chất lượng hoàn thành), clarityScore (độ rõ nét).'
  ]
    .filter(Boolean)
    .join('\n')

  const systemInstruction = [
    'Bạn là hệ thống đánh giá chất lượng ảnh xác thực (Proof Verification Rubric) của LifeQuest.',
    'NGUYÊN TẮC TỔNG QUÁT:',
    '- Suy luận ngữ nghĩa linh hoạt giữa hình ảnh thực tế và mọi loại nhiệm vụ (học tập, thể thao, làm việc, đọc sách, uống nước, dọn dẹp...), không rập khuôn.',
    '- Nếu overall >= 75 -> APPROVED; 45..74 -> NEEDS_REVIEW (góp ý cách chụp rõ hơn); < 45 -> REJECTED.',
    '- Viết reason, foxReaction (giọng Cáo Fox gần gũi, khen chi tiết cụ thể trong ảnh) và suggestedCaption bằng tiếng Việt ngắn gọn.'
  ].join('\n')

  const llm = await callGeminiStructured<{
    verdict: ProofVerdict
    relevanceScore: number
    authenticityScore: number
    effortScore: number
    clarityScore: number
    detectedObjects: string[]
    reason: string
    foxReaction: string
    suggestedCaption: string
  }>({
    prompt,
    systemInstruction,
    responseSchema: schema,
    inlineImages: [{ mimeType: req.imageMimeType, dataBase64: base64Data }],
    temperature: 0.2,
    env,
    fetchImpl: options.fetchImpl
  })

  if (!llm.ok || !llm.data) {
    return buildFallbackProofResult({ ...req, userId, imageBase64: base64Data }, imageSha256, false)
  }

  const rubric = computeOverallRubric(
    llm.data.relevanceScore,
    llm.data.authenticityScore,
    llm.data.effortScore,
    llm.data.clarityScore
  )
  const verdict: ProofVerdict =
    llm.data.verdict ?? (rubric.overallScore >= 75 ? 'APPROVED' : rubric.overallScore >= 45 ? 'NEEDS_REVIEW' : 'REJECTED')
  const verified = verdict === 'APPROVED'
  const isExcellent = verified && rubric.overallScore >= 85
  const bonusXp = isExcellent ? 10 : 0

  if (verified) {
    rememberVerifiedHash(userId, req.questId, imageSha256)
  }

  return {
    questId: req.questId,
    verified,
    verdict,
    qualityBadge: isExcellent ? 'EXCELLENT' : verified ? 'VERIFIED' : verdict === 'NEEDS_REVIEW' ? 'NEEDS_RETRY' : 'REJECTED',
    confidenceScore: Number((rubric.overallScore / 100).toFixed(2)),
    bonusXp,
    duplicateDetected: false,
    imageSha256,
    qualityRubric: rubric,
    detectedObjects: Array.isArray(llm.data.detectedObjects) ? llm.data.detectedObjects.slice(0, 6) : [],
    reason: llm.data.reason,
    foxReaction: llm.data.foxReaction,
    suggestedCaption: llm.data.suggestedCaption,
    recommendedShareTargets: verified ? ['PRIVATE_JOURNAL', 'GROUP_CHAT', 'SOCIAL_FEED'] : [],
    provider: 'gemini-vision'
  }
}
