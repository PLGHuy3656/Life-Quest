import type { MascotIntentResponse, PlanLevel } from '../domain/types.js'

export function parseMascotIntent(rawText: string): MascotIntentResponse {
  const clean = rawText.trim()
  const lower = clean.toLowerCase()

  // Extract durationDays
  let durationDays = 30
  const daysMatch = lower.match(/(\d+)\s*(ngày|ngay|days?)/)
  const weeksMatch = lower.match(/(\d+)\s*(tuần|tuan|weeks?)/)
  const monthsMatch = lower.match(/(\d+)\s*(tháng|thang|months?)/)

  if (daysMatch) {
    durationDays = Math.max(1, Math.min(365, Number.parseInt(daysMatch[1], 10)))
  } else if (weeksMatch) {
    durationDays = Math.max(1, Math.min(365, Number.parseInt(weeksMatch[1], 10) * 7))
  } else if (monthsMatch) {
    durationDays = Math.max(1, Math.min(365, Number.parseInt(monthsMatch[1], 10) * 30))
  }

  // Extract availableMinutesPerDay
  let availableMinutesPerDay = 60
  const minMatch = lower.match(/(\d+)\s*(phút|phut|p\b|min|minutes?)/)
  const hourMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(tiếng|tieng|giờ|gio|h\b|hours?)/)

  if (minMatch) {
    availableMinutesPerDay = Math.max(10, Math.min(480, Number.parseInt(minMatch[1], 10)))
  } else if (hourMatch) {
    const hrs = Number.parseFloat(hourMatch[1].replace(',', '.'))
    if (Number.isFinite(hrs)) {
      availableMinutesPerDay = Math.max(15, Math.min(480, Math.round(hrs * 60)))
    }
  }

  // Detect level
  let level: PlanLevel = 'BEGINNER'
  if (/(nâng cao|chuyên sâu|advanced|master|7\.5|8\.0|senior)/.test(lower)) {
    level = 'ADVANCED'
  } else if (/(trung cấp|intermediate|ôn luyện|cải thiện|6\.5)/.test(lower)) {
    level = 'INTERMEDIATE'
  }

  // Detect category
  let targetCategory = 'Phát triển bản thân'
  if (/(ielts|toeic|tiếng anh|english|học|ôn thi|đọc sách|toán)/.test(lower)) {
    targetCategory = 'Học tập & Tri thức'
  } else if (/(chạy bộ|gym|tập|giảm cân|sức khỏe|yoga|thể dục)/.test(lower)) {
    targetCategory = 'Sức khỏe & Thể chất'
  } else if (/(code|lập trình|react|node|python|typescript|đồ án|project|ai|portfolio)/.test(lower)) {
    targetCategory = 'Sự nghiệp & Kỹ năng số'
  }

  const isMultiStep =
    Boolean(daysMatch || weeksMatch || monthsMatch) ||
    /(lộ trình|kế hoạch|chinh phục|học |luyện |giảm cân|đồ án|mỗi ngày)/.test(lower)

  const suggestedEntity: MascotIntentResponse['suggestedEntity'] = isMultiStep
    ? 'AI_PLAN'
    : clean.length > 45
      ? 'GOAL'
      : 'TASK'

  return {
    rawText: clean,
    suggestedEntity,
    prompt: clean,
    durationDays,
    availableMinutesPerDay,
    level,
    targetCategory,
    confidence: isMultiStep ? 0.91 : 0.78,
    foxReply: `Fox nhận diện đây là mục tiêu ${targetCategory} (${durationDays} ngày, ~${availableMinutesPerDay} phút/ngày, mức ${level}). Bạn bấm Sinh lộ trình để Fox lên kế hoạch nhé!`
  }
}
