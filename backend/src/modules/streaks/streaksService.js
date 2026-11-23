import { streaksRepository } from './streaksRepository.js'
import { usersRepository } from '../users/usersRepository.js'
import { resolveEntitlement } from '../../common/utils/entitlement.js'
import ApiError from '../../common/errors/ApiError.js'
import { eventBus } from '../../common/events/eventBus.js'
import { EVENT_TYPES } from '../../common/events/eventTypes.js'

/**
 * Tính toán flameTier tương thích trực tiếp với StreakFlame.ts ở Frontend
 * < 3: null (chưa bật lửa)
 * 3..6: 'orange' (ngọn lửa ấm)
 * 7..13: 'blue' (ngọn lửa xanh kiên trì)
 * 14..29: 'purple' (ngọn lửa tím dũng mãnh)
 * >= 30: 'crimson' (ngọn lửa huyền thoại)
 */
export const computeFlameTier = (streakCount) => {
  if (streakCount < 3) return null
  if (streakCount <= 6) return 'orange'
  if (streakCount <= 13) return 'blue'
  if (streakCount <= 29) return 'purple'
  return 'crimson'
}

const getOrCreateStreak = async (userId) => {
  let streak = await streaksRepository.findStreakByUserId(userId)
  if (!streak) {
    const user = await usersRepository.findUserById(userId)
    const entitlement = resolveEntitlement(user)
    const initialFreezeCount = entitlement.effectiveTier === 'PREMIUM' ? 3 : 1

    streak = await streaksRepository.createStreak({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      freezeCount: initialFreezeCount,
      isFrozenToday: false
    })
  }
  return streak
}

const getMyStreak = async (userId) => {
  const streak = await getOrCreateStreak(userId)
  return {
    id: streak.id,
    userId: streak.userId,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastCompletedDate: streak.lastCompletedDate,
    freezeCount: streak.freezeCount,
    isFrozenToday: streak.isFrozenToday,
    flameTier: computeFlameTier(streak.currentStreak)
  }
}

const freezeStreak = async (userId) => {
  const streak = await getOrCreateStreak(userId)

  if (streak.isFrozenToday) {
    throw new ApiError(409, 'Streak is already frozen for today', 'ALREADY_FROZEN')
  }

  if (streak.freezeCount <= 0) {
    throw new ApiError(400, 'Insufficient streak freezes available', 'INSUFFICIENT_FREEZE')
  }

  const updated = await streaksRepository.updateStreak(userId, {
    freezeCount: streak.freezeCount - 1,
    isFrozenToday: true
  })

  return {
    id: updated.id,
    userId: updated.userId,
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    lastCompletedDate: updated.lastCompletedDate,
    freezeCount: updated.freezeCount,
    isFrozenToday: updated.isFrozenToday,
    flameTier: computeFlameTier(updated.currentStreak)
  }
}

/**
 * Tự động tính toán chuỗi Streak khi nhận event QUEST_COMPLETED
 */
const onQuestCompleted = async (userId, completedAt = new Date()) => {
  const streak = await getOrCreateStreak(userId)
  const completedDateStr = new Date(completedAt).toISOString().slice(0, 10)

  // Nếu hôm nay đã tính streak rồi thì không cộng trùng
  if (streak.lastCompletedDate) {
    const lastDateStr = new Date(streak.lastCompletedDate).toISOString().slice(0, 10)
    if (lastDateStr === completedDateStr) {
      return streak
    }
  }

  let newStreak = 1
  if (streak.lastCompletedDate) {
    const prevDate = new Date(new Date(streak.lastCompletedDate).toISOString().slice(0, 10))
    const currDate = new Date(completedDateStr)
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Ngày liền kề -> tăng chuỗi
      newStreak = streak.currentStreak + 1
    } else if (diffDays > 1) {
      if (streak.isFrozenToday) {
        // Chuỗi được bảo vệ bởi Freeze
        newStreak = streak.currentStreak + 1
      } else {
        // Đứt chuỗi -> Reset về 1 và phát event STREAK_LOST
        newStreak = 1
        eventBus.emit(EVENT_TYPES.STREAK_LOST, {
          userId,
          previousStreak: streak.currentStreak,
          lostAt: completedAt
        })
      }
    }
  }

  const longestStreak = Math.max(streak.longestStreak, newStreak)

  const updated = await streaksRepository.updateStreak(userId, {
    currentStreak: newStreak,
    longestStreak,
    lastCompletedDate: completedAt,
    isFrozenToday: false
  })

  // Phát event STREAK_INCREASED
  eventBus.emit(EVENT_TYPES.STREAK_INCREASED, {
    userId,
    currentStreak: newStreak,
    longestStreak,
    flameTier: computeFlameTier(newStreak)
  })

  return updated
}

export const streaksService = {
  getMyStreak,
  freezeStreak,
  onQuestCompleted,
  computeFlameTier
}

export default streaksService
