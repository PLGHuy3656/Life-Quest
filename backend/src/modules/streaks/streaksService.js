import { streaksRepository } from './streaksRepository.js'
import ApiError from '../../common/errors/ApiError.js'
import { eventBus } from '../../common/events/eventBus.js'
import { EVENT_TYPES } from '../../common/events/eventTypes.js'

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 365]

// Format số Decimal cho StreakRule
const formatRule = (rule) => {
  if (!rule) return null
  return {
    ...rule,
    targetValue: rule.targetValue !== null ? Number(rule.targetValue) : null
  }
}

// Format Streak kèm Rule
const formatStreak = (streak) => {
  if (!streak) return null
  return {
    id: streak.id,
    userId: streak.userId,
    ruleId: streak.ruleId,
    currentCount: streak.currentCount,
    longestCount: streak.longestCount,
    lastQualifiedDate: streak.lastQualifiedDate,
    startedAt: streak.startedAt,
    updatedAt: streak.updatedAt,
    rule: formatRule(streak.rule)
  }
}

// Tạo quy tắc Streak mới
const createStreakRule = async (userId, data) => {
  const rule = await streaksRepository.createRule(userId, data)

  // Khởi tạo bản ghi tiến trình streak tương ứng
  await streaksRepository.upsertStreak(userId, rule.id, {
    currentCount: 0,
    longestCount: 0,
    startedAt: new Date()
  })

  return formatRule(rule)
}

// Lấy danh sách quy tắc Streak của User
const getStreakRules = async (userId, query) => {
  const rules = await streaksRepository.findRulesByUserId(userId, query)
  return rules.map(formatRule)
}

// Lấy chi tiết quy tắc theo ID
const getStreakRuleById = async (userId, ruleId) => {
  const rule = await streaksRepository.findRuleById(ruleId)
  if (!rule || rule.userId !== userId) {
    throw new ApiError(404, 'Streak rule not found', 'RULE_NOT_FOUND')
  }
  return formatRule(rule)
}

// Cập nhật quy tắc Streak
const updateStreakRule = async (userId, ruleId, data) => {
  const rule = await streaksRepository.findRuleById(ruleId)
  if (!rule || rule.userId !== userId) {
    throw new ApiError(404, 'Streak rule not found', 'RULE_NOT_FOUND')
  }

  const updated = await streaksRepository.updateRule(ruleId, data)
  return formatRule(updated)
}

// Vô hiệu hóa quy tắc Streak
const deleteStreakRule = async (userId, ruleId) => {
  const rule = await streaksRepository.findRuleById(ruleId)
  if (!rule || rule.userId !== userId) {
    throw new ApiError(404, 'Streak rule not found', 'RULE_NOT_FOUND')
  }

  await streaksRepository.deleteRule(ruleId)
  return { success: true, message: 'Streak rule disabled successfully' }
}

// Lấy toàn bộ danh sách tiến trình Streaks của User
const getMyStreaks = async (userId) => {
  const streaks = await streaksRepository.findStreaksByUserId(userId)
  return streaks.map(formatStreak)
}

// Ghi nhận hoàn thành điều kiện Streak (idempotent theo ngày)
const recordStreakProgress = async (userId, ruleId, qualifiedDate = new Date()) => {
  const rule = await streaksRepository.findRuleById(ruleId)
  if (!rule || !rule.isActive) {
    return null
  }

  const currentStreak = await streaksRepository.findStreakByRuleId(userId, ruleId)
  const today = new Date(qualifiedDate.toISOString().split('T')[0])

  if (!currentStreak) {
    return await streaksRepository.upsertStreak(userId, ruleId, {
      currentCount: 1,
      longestCount: 1,
      lastQualifiedDate: today,
      startedAt: today
    })
  }

  if (currentStreak.lastQualifiedDate) {
    const lastDate = new Date(currentStreak.lastQualifiedDate.toISOString().split('T')[0])
    const diffTime = today.getTime() - lastDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24))

    // Đã tính streak cho ngày hôm nay rồi -> không cộng dồn thêm
    if (diffDays === 0) {
      return formatStreak(currentStreak)
    }

    // Đúng ngày tiếp theo -> tăng streak
    if (diffDays === 1) {
      const newCurrent = currentStreak.currentCount + 1
      const newLongest = Math.max(currentStreak.longestCount, newCurrent)
      const updated = await streaksRepository.upsertStreak(userId, ruleId, {
        currentCount: newCurrent,
        longestCount: newLongest,
        lastQualifiedDate: today
      })
      if (STREAK_MILESTONES.includes(newCurrent)) {
        try {
          eventBus.emit(EVENT_TYPES.STREAK_MILESTONE, {
            userId,
            streakId: updated.id,
            ruleId,
            currentCount: newCurrent
          })
        } catch { /* ignore */ }
      }
      return formatStreak(updated)
    }
  }

  // Bị đứt chuỗi (diffDays > 1 hoặc chưa có ngày bắt đầu)
  const updated = await streaksRepository.upsertStreak(userId, ruleId, {
    currentCount: 1,
    longestCount: Math.max(currentStreak.longestCount, 1),
    lastQualifiedDate: today,
    startedAt: today
  })

  return formatStreak(updated)
}

export const streaksService = {
  createStreakRule,
  getStreakRules,
  getStreakRuleById,
  updateStreakRule,
  deleteStreakRule,
  getMyStreaks,
  recordStreakProgress
}
