import prisma from '../../config/database.js'

// Tìm kiếm Execution theo ID kèm thông tin Quest và các phiên Focus
const findExecutionById = async (executionId, tx) => {
  const db = tx || prisma
  return await db.questExecution.findUnique({
    where: {
      id: executionId
    },
    include: {
      quest: true,
      schedule: true,
      focusSessions: {
        orderBy: {
          startedAt: 'desc'
        }
      }
    }
  })
}

// Lấy danh sách Execution theo bộ lọc
const findExecutions = async (userId, filters = {}, tx) => {
  const db = tx || prisma
  const where = {
    userId
  }

  if (filters.questId) {
    where.questId = filters.questId
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.date) {
    const startOfDay = new Date(`${filters.date}T00:00:00.000Z`)
    const endOfDay = new Date(`${filters.date}T23:59:59.999Z`)
    where.OR = [
      { scheduledAt: { gte: startOfDay, lte: endOfDay } },
      { startedAt: { gte: startOfDay, lte: endOfDay } },
      { completedAt: { gte: startOfDay, lte: endOfDay } }
    ]
  } else if (filters.startDate || filters.endDate) {
    where.scheduledAt = {}
    if (filters.startDate) where.scheduledAt.gte = new Date(filters.startDate)
    if (filters.endDate) where.scheduledAt.lte = new Date(filters.endDate)
  }

  return await db.questExecution.findMany({
    where,
    include: {
      quest: {
        select: {
          id: true,
          title: true,
          type: true,
          priority: true,
          proofRequirement: true,
          targetValue: true,
          targetUnit: true,
          xpReward: true,
          coinReward: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Tạo mới một Execution
const createExecution = async (executionData, tx) => {
  const db = tx || prisma
  return await db.questExecution.create({
    data: {
      questId: executionData.questId,
      userId: executionData.userId,
      scheduleId: executionData.scheduleId || null,
      status: executionData.status || 'PLANNED',
      scheduledAt: executionData.scheduledAt ? new Date(executionData.scheduledAt) : null,
      startedAt: executionData.startedAt ? new Date(executionData.startedAt) : null,
      progressValue: executionData.progressValue || 0,
      durationSeconds: executionData.durationSeconds || 0
    },
    include: {
      quest: true
    }
  })
}

// Cập nhật thông tin Execution
const updateExecution = async (executionId, data, tx) => {
  const db = tx || prisma
  return await db.questExecution.update({
    where: {
      id: executionId
    },
    data,
    include: {
      quest: true
    }
  })
}

// Tính tổng thời lượng (giây) của các FocusSession đã hoàn thành thuộc Execution
const sumCompletedFocusSeconds = async (executionId, tx) => {
  const db = tx || prisma
  const result = await db.focusSession.aggregate({
    where: {
      executionId,
      status: 'COMPLETED'
    },
    _sum: {
      durationSeconds: true
    }
  })
  return result._sum.durationSeconds || 0
}

// Cộng thưởng XP và Coin cho User khi hoàn thành nhiệm vụ
const awardRewards = async (userId, xpReward, coinReward, tx) => {
  const db = tx || prisma

  // Tìm hoặc tạo gamification record
  const current = await db.userGamification.findUnique({
    where: { userId }
  })

  if (!current) {
    const newXp = BigInt(xpReward)
    const newCoins = BigInt(coinReward)
    const level = Math.floor(Number(newXp) / 100) + 1
    return await db.userGamification.create({
      data: {
        userId,
        totalXp: newXp,
        level,
        coinBalance: newCoins
      }
    })
  }

  const updatedXp = current.totalXp + BigInt(xpReward)
  const updatedCoins = current.coinBalance + BigInt(coinReward)
  const updatedLevel = Math.floor(Number(updatedXp) / 100) + 1

  return await db.userGamification.update({
    where: { userId },
    data: {
      totalXp: updatedXp,
      coinBalance: updatedCoins,
      level: updatedLevel
    }
  })
}

export const executionsRepository = {
  findExecutionById,
  findExecutions,
  createExecution,
  updateExecution,
  sumCompletedFocusSeconds,
  awardRewards
}
