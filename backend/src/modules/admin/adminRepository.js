import prisma from '../../config/database.js'

// Tạo báo cáo vi phạm
const createReport = async (reporterId, data) => {
  return await prisma.report.create({
    data: {
      reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      description: data.description || null,
      status: 'PENDING'
    }
  })
}

// Lấy danh sách báo cáo vi phạm
const findReports = async ({ skip = 0, take = 20, status, targetType } = {}) => {
  const where = {}
  if (status) where.status = status
  if (targetType) where.targetType = targetType

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take,
      include: {
        reporter: {
          select: { id: true, username: true, email: true }
        },
        reviewer: {
          select: { id: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.report.count({ where })
  ])

  return { reports, total }
}

// Tìm báo cáo theo ID
const findReportById = async (reportId) => {
  return await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: {
        select: { id: true, username: true, email: true }
      }
    }
  })
}

// Cập nhật trạng thái báo cáo
const updateReport = async (reportId, data) => {
  return await prisma.report.update({
    where: { id: reportId },
    data
  })
}

// Lấy danh sách người dùng cho Admin
const findUsers = async ({ skip = 0, take = 20, status, q } = {}) => {
  const where = {}
  if (status) where.status = status
  if (q) {
    where.OR = [
      { username: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        profile: true,
        gamification: {
          select: { level: true, totalXp: true, coinBalance: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ])

  return { users, total }
}

// Cập nhật người dùng
const updateUser = async (userId, data) => {
  return await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true
    }
  })
}

// Tạo Achievement
const createAchievement = async (data) => {
  return await prisma.achievement.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description || null,
      type: data.type,
      conditionConfig: data.conditionConfig,
      rewardXp: data.rewardXp || 0,
      rewardCoin: data.rewardCoin || 0,
      isHidden: data.isHidden || false,
      isActive: true
    }
  })
}

// Cập nhật Achievement
const updateAchievement = async (id, data) => {
  return await prisma.achievement.update({
    where: { id },
    data
  })
}

// Tạo Reward Item
const createReward = async (data) => {
  return await prisma.rewardItem.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description || null,
      category: data.category,
      priceCoin: BigInt(data.priceCoin || 0),
      requiredLevel: data.requiredLevel || 1,
      metadata: data.metadata || null,
      isActive: true
    }
  })
}

// Cập nhật Reward Item
const updateReward = async (id, data) => {
  const updateData = { ...data }
  if (data.priceCoin !== undefined) {
    updateData.priceCoin = BigInt(data.priceCoin)
  }

  return await prisma.rewardItem.update({
    where: { id },
    data: updateData
  })
}

// Lấy danh sách Challenges
const findAdminChallenges = async ({ skip = 0, take = 20 } = {}) => {
  const [challenges, total] = await Promise.all([
    prisma.challenge.findMany({
      skip,
      take,
      include: {
        creator: { select: { id: true, username: true } },
        _count: { select: { members: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.challenge.count()
  ])

  return { challenges, total }
}

// Cập nhật Challenge
const updateAdminChallenge = async (id, data) => {
  return await prisma.challenge.update({
    where: { id },
    data
  })
}

// Thống kê toàn hệ thống
const getSystemAnalytics = async () => {
  const [totalUsers, totalQuests, totalExecutions, totalDuos, totalChallenges, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.quest.count(),
    prisma.questExecution.count({ where: { status: 'COMPLETED' } }),
    prisma.duo.count({ where: { status: 'ACTIVE' } }),
    prisma.challenge.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } })
  ])

  return {
    totalUsers,
    activeUsers,
    totalQuests,
    completedExecutions: totalExecutions,
    activeDuos: totalDuos,
    activeChallenges: totalChallenges
  }
}

// Ghi nhật ký kiểm toán Audit Log
const createAuditLog = async (data) => {
  return await prisma.auditLog.create({
    data: {
      actorUserId: data.actorUserId || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || null,
      oldData: data.oldData || null,
      newData: data.newData || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null
    }
  })
}

// Lấy danh sách nhật ký kiểm toán
const findAuditLogs = async ({ skip = 0, take = 50 } = {}) => {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take,
      include: {
        actor: { select: { id: true, username: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.auditLog.count()
  ])

  return { logs, total }
}

export const adminRepository = {
  createReport,
  findReports,
  findReportById,
  updateReport,
  findUsers,
  updateUser,
  createAchievement,
  updateAchievement,
  createReward,
  updateReward,
  findAdminChallenges,
  updateAdminChallenge,
  getSystemAnalytics,
  createAuditLog,
  findAuditLogs
}
