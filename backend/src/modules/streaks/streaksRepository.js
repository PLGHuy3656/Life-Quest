import prisma from '../../config/database.js'

// Tạo quy tắc streak
const createRule = async (userId, data) => {
  return await prisma.streakRule.create({
    data: {
      userId,
      ruleType: data.ruleType,
      targetId: data.targetId || null,
      targetValue: data.targetValue !== undefined ? data.targetValue : null,
      frequency: data.frequency || 'DAILY'
    }
  })
}

// Lấy danh sách quy tắc streak của User
const findRulesByUserId = async (userId, { isActive } = {}) => {
  const where = { userId }
  if (isActive !== undefined) {
    where.isActive = isActive
  }
  return await prisma.streakRule.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })
}

// Tìm quy tắc theo ID
const findRuleById = async (ruleId) => {
  return await prisma.streakRule.findUnique({
    where: { id: ruleId }
  })
}

// Cập nhật quy tắc
const updateRule = async (ruleId, data) => {
  return await prisma.streakRule.update({
    where: { id: ruleId },
    data
  })
}

// Vô hiệu hóa hoặc xóa quy tắc
const deleteRule = async (ruleId) => {
  return await prisma.streakRule.update({
    where: { id: ruleId },
    data: { isActive: false }
  })
}

// Lấy danh sách streaks của User kèm thông tin Rule
const findStreaksByUserId = async (userId) => {
  return await prisma.streak.findMany({
    where: { userId },
    include: {
      rule: true
    },
    orderBy: { updatedAt: 'desc' }
  })
}

// Tìm bản ghi streak theo user và rule
const findStreakByRuleId = async (userId, ruleId) => {
  return await prisma.streak.findUnique({
    where: {
      userId_ruleId: {
        userId,
        ruleId
      }
    },
    include: {
      rule: true
    }
  })
}

// Lưu tiến trình streak
const upsertStreak = async (userId, ruleId, data) => {
  return await prisma.streak.upsert({
    where: {
      userId_ruleId: {
        userId,
        ruleId
      }
    },
    update: data,
    create: {
      userId,
      ruleId,
      ...data
    },
    include: {
      rule: true
    }
  })
}

export const streaksRepository = {
  createRule,
  findRulesByUserId,
  findRuleById,
  updateRule,
  deleteRule,
  findStreaksByUserId,
  findStreakByRuleId,
  upsertStreak
}
