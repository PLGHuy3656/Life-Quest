import type {
  AlarmDifficulty,
  AlarmMiniGameType,
  AlarmMinigameChallenge,
  AlarmMinigameGenerateRequest,
  DailyWakeupAlarmStatus
} from '../domain/types.js'

const ALL_PLAYABLE_GAMES: Array<Exclude<AlarmMiniGameType, 'NONE'>> = [
  'MEMORY_SEQUENCE',
  'MATH',
  'TYPING',
  'QUICK_TAP'
]

interface UserDailyWakeupRecord {
  dateKey: string
  alarmTime: string
  completedToday: boolean
  completedAt: string | null
  challenge: AlarmMinigameChallenge
}

// Per-user in-memory daily wakeup store (1 challenge/day, never repeats yesterday's mini-game type)
const dailyWakeupByUserDate = new Map<string, UserDailyWakeupRecord>()
const lastMiniGameByUser = new Map<string, Exclude<AlarmMiniGameType, 'NONE'>>()

function todayLocalDateKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function pickRotatedMiniGameForDate(
  userId: string,
  dateKey: string,
  previousType: Exclude<AlarmMiniGameType, 'NONE'> | null
): Exclude<AlarmMiniGameType, 'NONE'> {
  const pool = previousType
    ? ALL_PLAYABLE_GAMES.filter((g) => g !== previousType)
    : ALL_PLAYABLE_GAMES
  // Deterministic yet varied per day + user so same day always serves the same 1 challenge
  let hash = 0
  const seed = `${userId}:${dateKey}`
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return pool[hash % pool.length]
}

export function getDailyWakeupStatus(params: {
  userId?: string
  dateKey?: string
  alarmTime?: string
  snoozeCount?: number
} = {}): DailyWakeupAlarmStatus {
  const userId = params.userId?.trim() || 'demo-user'
  const dateKey = params.dateKey?.trim() || todayLocalDateKey()
  const alarmTime = params.alarmTime?.trim() || '07:00'
  const storeKey = `${userId}::${dateKey}`
  const lastType = lastMiniGameByUser.get(userId) ?? null

  let record = dailyWakeupByUserDate.get(storeKey)
  if (!record) {
    const selectedType = pickRotatedMiniGameForDate(userId, dateKey, lastType)
    const challenge = generateAlarmMinigameChallenge({
      miniGameType: selectedType,
      snoozeCount: params.snoozeCount ?? 1,
      morningQuestTitle: `Nhiệm vụ khởi đầu ngày mới (${alarmTime})`
    })
    record = {
      dateKey,
      alarmTime,
      completedToday: false,
      completedAt: null,
      challenge
    }
    dailyWakeupByUserDate.set(storeKey, record)
  }

  return {
    agent: 'alarm-coach',
    dateKey: record.dateKey,
    alarmTime: record.alarmTime,
    questTitle: `Nhiệm vụ khởi đầu ngày mới (${record.alarmTime})`,
    completedToday: record.completedToday,
    completedAt: record.completedAt,
    lastPlayedMiniGameType: lastType,
    todayChallenge: record.challenge
  }
}

export function completeDailyWakeup(params: {
  userId?: string
  dateKey?: string
} = {}): DailyWakeupAlarmStatus {
  const userId = params.userId?.trim() || 'demo-user'
  const dateKey = params.dateKey?.trim() || todayLocalDateKey()
  const status = getDailyWakeupStatus({ userId, dateKey })
  const storeKey = `${userId}::${dateKey}`
  const existing = dailyWakeupByUserDate.get(storeKey)

  if (existing && !existing.completedToday) {
    existing.completedToday = true
    existing.completedAt = new Date().toISOString()
    lastMiniGameByUser.set(userId, existing.challenge.miniGameType)
  }

  return {
    ...status,
    completedToday: true,
    completedAt: existing?.completedAt ?? new Date().toISOString(),
    lastPlayedMiniGameType: lastMiniGameByUser.get(userId) ?? status.todayChallenge.miniGameType
  }
}

const MEMORY_PALETTE = [
  { id: 'fox', label: 'Cáo Fox', emoji: '🦊' },
  { id: 'fire', label: 'Ngọn lửa', emoji: '🔥' },
  { id: 'star', label: 'Ngôi sao', emoji: '⭐' },
  { id: 'book', label: 'Sách học', emoji: '📚' }
]

const AFFIRMATIONS_BY_DIFFICULTY: Record<AlarmDifficulty, string[]> = {
  EASY: [
    'Hôm nay tôi thức dậy đúng giờ cùng Fox',
    'Mỗi buổi sáng là một khởi đầu tuyệt vời'
  ],
  MEDIUM: [
    'Tôi hoàn thành mục tiêu sáng nay để giữ chuỗi LifeQuest',
    'Dậy sớm 15 phút giúp tôi làm chủ cả ngày hôm nay'
  ],
  HARD: [
    'Kỷ luật mỗi sáng tạo nên phiên bản xuất sắc nhất của chính tôi',
    'Không bấm Snooze hôm nay tôi sẽ chinh phục trọn vẹn mọi Quest'
  ]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateAlarmMinigameChallenge(
  req: AlarmMinigameGenerateRequest = {}
): AlarmMinigameChallenge {
  const snooze = req.snoozeCount ?? 0
  const difficulty: AlarmDifficulty =
    req.difficulty ?? (snooze >= 3 ? 'HARD' : snooze >= 1 ? 'MEDIUM' : 'EASY')

  const miniGameType: Exclude<AlarmMiniGameType, 'NONE'> =
    req.miniGameType ??
    (snooze >= 2 ? 'MEMORY_SEQUENCE' : snooze === 1 ? 'MATH' : 'MEMORY_SEQUENCE')

  const questHint = req.morningQuestTitle?.trim() || 'Chạy bộ 20 phút buổi sáng'
  const rewardXp = difficulty === 'HARD' ? 45 : difficulty === 'MEDIUM' ? 30 : 20
  const rewardCoin = difficulty === 'HARD' ? 25 : difficulty === 'MEDIUM' ? 15 : 10
  const challengeId = `alarm-mg-${Date.now()}-${randomInt(100, 999)}`
  const affirmations = AFFIRMATIONS_BY_DIFFICULTY[difficulty]
  const affirmation = affirmations[randomInt(0, affirmations.length - 1)]

  if (miniGameType === 'MATH') {
    const count = difficulty === 'HARD' ? 3 : difficulty === 'MEDIUM' ? 2 : 1
    const mathProblems = Array.from({ length: count }, () => {
      if (difficulty === 'HARD') {
        const a = randomInt(12, 28)
        const b = randomInt(4, 9)
        const c = randomInt(10, 35)
        return { expression: `${a} × ${b} - ${c}`, answer: a * b - c }
      }
      if (difficulty === 'MEDIUM') {
        const a = randomInt(15, 45)
        const b = randomInt(12, 39)
        return { expression: `${a} + ${b}`, answer: a + b }
      }
      const a = randomInt(5, 19)
      const b = randomInt(4, 15)
      return { expression: `${a} + ${b}`, answer: a + b }
    })

    return {
      agent: 'alarm-coach',
      challengeId,
      miniGameType: 'MATH',
      difficulty,
      title: `Toán tỉnh ngủ (${difficulty})`,
      instruction: `Giải đúng ${count} phép tính nhanh để tắt báo thức và mở khóa nhiệm vụ "${questHint}".`,
      affirmation,
      foxPrompt: `Dậy thôi nào! Giải nhanh ${count} phép tính nhỏ là tỉnh táo ngay lập tức!`,
      rewardXp,
      rewardCoin,
      mathProblems
    }
  }

  if (miniGameType === 'TYPING') {
    return {
      agent: 'alarm-coach',
      challengeId,
      miniGameType: 'TYPING',
      difficulty,
      title: `Gõ lời khẳng định sáng (${difficulty})`,
      instruction: 'Gõ chính xác câu khẳng định bên dưới để tắt chuông báo thức.',
      affirmation,
      foxPrompt: 'Gõ câu khẳng định năng lượng này để nạp tinh thần cho cả ngày nhé!',
      rewardXp,
      rewardCoin,
      typingTarget: affirmation
    }
  }

  if (miniGameType === 'QUICK_TAP') {
    const targetCount = difficulty === 'HARD' ? 18 : difficulty === 'MEDIUM' ? 12 : 8
    const timeLimit = difficulty === 'HARD' ? 10 : 12
    return {
      agent: 'alarm-coach',
      challengeId,
      miniGameType: 'QUICK_TAP',
      difficulty,
      title: `Chạm đánh thức Fox (${difficulty})`,
      instruction: `Bấm liên tục ${targetCount} lần trong ${timeLimit} giây để đánh thức Fox và tắt báo thức!`,
      affirmation,
      foxPrompt: 'Bấm thật nhanh vào chuông để đánh bay cơn buồn ngủ nào!',
      rewardXp,
      rewardCoin,
      quickTapTargetCount: targetCount,
      quickTapTimeLimitSeconds: timeLimit
    }
  }

  // Default: MEMORY_SEQUENCE
  const seqLength = difficulty === 'HARD' ? 5 : difficulty === 'MEDIUM' ? 4 : 3
  const memorySequence = Array.from(
    { length: seqLength },
    () => MEMORY_PALETTE[randomInt(0, MEMORY_PALETTE.length - 1)].id
  )

  return {
    agent: 'alarm-coach',
    challengeId,
    miniGameType: 'MEMORY_SEQUENCE',
    difficulty,
    title: `Chuỗi trí nhớ tỉnh táo (${difficulty})`,
    instruction: `Ghi nhớ thứ tự ${seqLength} biểu tượng phát sáng rồi bấm lại đúng trình tự để tắt báo thức.`,
    affirmation,
    foxPrompt: `Nhìn kỹ ${seqLength} biểu tượng này nhé — bấm đúng là nhận ngay +${rewardXp} XP!`,
    rewardXp,
    rewardCoin,
    memorySequence,
    memoryPalette: MEMORY_PALETTE
  }
}
