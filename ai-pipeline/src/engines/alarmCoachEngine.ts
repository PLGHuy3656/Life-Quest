import type {
  AlarmCoachRequest,
  AlarmCoachResponse,
  AlarmDifficulty,
  AlarmMiniGameType,
  DataSource
} from '../domain/types.js'
import { getMockAlarmTriggers14d } from '../mock/alarmMinigameFixtures.js'

/**
 * AI Smart Alarm & Mini-Game Coach (aligned with Branch 4: alarms-and-minigames).
 * Analyzes 14-day AlarmTrigger history (DISMISSED vs MISSED, snoozeCount, difficulty)
 * to recommend adaptive mini-game type, difficulty, maxSnoozeCount, and morning affirmation.
 */
export function analyzeAlarmDiscipline(req: AlarmCoachRequest): AlarmCoachResponse {
  const hasReal = Array.isArray(req.triggers) && req.triggers.length > 0
  const useMock = !hasReal && (req.useMockIfEmpty ?? true)
  const triggers = useMock ? getMockAlarmTriggers14d() : (req.triggers ?? [])
  const dataSource: DataSource = useMock ? 'MOCK' : 'LIVE'

  const sample = triggers[0] ?? {
    alarmId: 'alarm-default',
    label: 'Báo thức buổi sáng',
    timeOfDay: '06:30',
    miniGameType: 'MATH' as AlarmMiniGameType,
    difficulty: 'EASY' as AlarmDifficulty,
    status: 'DISMISSED' as const,
    snoozeCount: 0,
    attempts: 1
  }

  const total = Math.max(1, triggers.length)
  const dismissedCount = triggers.filter((t) => t.status === 'DISMISSED').length
  const missedCount = triggers.filter((t) => t.status === 'MISSED').length
  const onTimeRatePercent = Math.round((dismissedCount / total) * 100)
  const avgSnoozeCount = Number(
    (triggers.reduce((acc, t) => acc + t.snoozeCount, 0) / total).toFixed(1)
  )

  const questTitle =
    req.morningQuestTitle?.trim() ||
    triggers.find((t) => t.linkedQuestTitle)?.linkedQuestTitle ||
    'hoàn thành nhiệm vụ đầu ngày'

  let recommendedMiniGame: AlarmMiniGameType = sample.miniGameType
  let recommendedDifficulty: AlarmDifficulty = sample.difficulty
  let recommendedMaxSnooze = 2
  let reason = ''
  let foxAdvice = ''

  if (missedCount >= 3 || avgSnoozeCount >= 2.0) {
    // User is sleeping through or over-snoozing current mini-game
    recommendedMiniGame = sample.miniGameType === 'MATH' ? 'MEMORY_SEQUENCE' : 'TYPING'
    recommendedDifficulty = sample.difficulty === 'EASY' ? 'MEDIUM' : 'HARD'
    recommendedMaxSnooze = 1
    reason = `14 ngày qua bạn bỏ lỡ ${missedCount}/${total} lần báo thức ${sample.timeOfDay} và bấm Snooze trung bình ${avgSnoozeCount} lần ở chế độ ${sample.miniGameType} (${sample.difficulty}).`
    foxAdvice = `Đổi sang thử thách ${recommendedMiniGame} mức ${recommendedDifficulty} và giới hạn tối đa 1 lần Snooze sẽ giúp não tỉnh táo nhanh hơn buổi sáng!`
  } else if (onTimeRatePercent >= 85 && avgSnoozeCount <= 0.8) {
    recommendedMiniGame = 'TYPING'
    recommendedDifficulty = 'EASY'
    recommendedMaxSnooze = 2
    reason = `Kỷ luật dậy sớm cực tốt (${onTimeRatePercent}% đúng giờ, snooze TB ${avgSnoozeCount}).`
    foxAdvice = `Bạn đã làm chủ khung ${sample.timeOfDay}! Chuyển sang gõ câu khẳng định gắn thẳng nhiệm vụ "${questTitle}" để nhận combo XP buổi sáng nhé.`
  } else {
    recommendedMiniGame = sample.miniGameType === 'NONE' ? 'MATH' : sample.miniGameType
    recommendedDifficulty = 'MEDIUM'
    recommendedMaxSnooze = 2
    reason = `Tỷ lệ dậy đúng giờ đạt ${onTimeRatePercent}% (snooze TB ${avgSnoozeCount}).`
    foxAdvice = `Giữ nhịp báo thức ${sample.timeOfDay} với ${recommendedMiniGame} mức MEDIUM để nâng tỷ lệ dậy đúng giờ lên trên 85% nhé!`
  }

  const suggestedAffirmation = `Hôm nay tôi dậy sớm đúng ${sample.timeOfDay} để ${questTitle.toLowerCase()}!`

  return {
    dataSource,
    alarmId: sample.alarmId,
    timeOfDay: sample.timeOfDay,
    onTimeRatePercent,
    avgSnoozeCount,
    missedCount,
    currentMiniGame: sample.miniGameType,
    currentDifficulty: sample.difficulty,
    recommendedMiniGame,
    recommendedDifficulty,
    recommendedMaxSnooze,
    suggestedAffirmation,
    reason,
    foxAdvice
  }
}
