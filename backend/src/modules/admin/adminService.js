import { adminRepository } from './adminRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Format RewardItem BigInt
const formatReward = (item) => {
  if (!item) return null
  return {
    ...item,
    priceCoin: item.priceCoin !== undefined ? Number(item.priceCoin) : 0
  }
}

// Format User BigInt
const formatUser = (user) => {
  if (!user) return null
  return {
    ...user,
    gamification: user.gamification
      ? {
          level: user.gamification.level,
          totalXp: user.gamification.totalXp !== undefined ? Number(user.gamification.totalXp) : 0,
          coinBalance: user.gamification.coinBalance !== undefined ? Number(user.gamification.coinBalance) : 0
        }
      : null
  }
}

// Tạo báo cáo vi phạm (Dành cho người dùng)
const createReport = async (reporterId, data) => {
  return await adminRepository.createReport(reporterId, data)
}

// Lấy danh sách báo cáo vi phạm
const getReports = async (query = {}) => {
  const page = Number(query.page || 1)
  const limit = Number(query.limit || 20)
  const skip = (page - 1) * limit

  const { reports, total } = await adminRepository.findReports({
    skip,
    take: limit,
    status: query.status,
    targetType: query.targetType
  })

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Xử lý báo cáo vi phạm
const updateReport = async (adminId, reportId, data, reqMeta = {}) => {
  const report = await adminRepository.findReportById(reportId)
  if (!report) {
    throw new ApiError(404, 'Report not found', 'REPORT_NOT_FOUND')
  }

  const updated = await adminRepository.updateReport(reportId, {
    status: data.status,
    reviewedBy: adminId,
    reviewedAt: new Date()
  })

  await adminRepository.createAuditLog({
    actorUserId: adminId,
    action: `RESOLVE_REPORT_${data.status}`,
    entityType: 'REPORT',
    entityId: reportId,
    oldData: { status: report.status },
    newData: { status: data.status },
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent
  })

  return updated
}

// Lấy danh sách người dùng cho Admin
const getUsers = async (query = {}) => {
  const page = Number(query.page || 1)
  const limit = Number(query.limit || 20)
  const skip = (page - 1) * limit

  const { users, total } = await adminRepository.findUsers({
    skip,
    take: limit,
    status: query.status,
    q: query.q
  })

  return {
    users: users.map(formatUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Cập nhật trạng thái người dùng (ACTIVE, SUSPENDED, BANNED)
const updateUserStatus = async (adminId, userId, status, reqMeta = {}) => {
  const user = await adminRepository.updateUser(userId, { status })

  await adminRepository.createAuditLog({
    actorUserId: adminId,
    action: `UPDATE_USER_STATUS_${status}`,
    entityType: 'USER',
    entityId: userId,
    newData: { status },
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent
  })

  return user
}

// Tạo mới Achievement
const createAchievement = async (adminId, data, reqMeta = {}) => {
  const achievement = await adminRepository.createAchievement(data)

  await adminRepository.createAuditLog({
    actorUserId: adminId,
    action: 'CREATE_ACHIEVEMENT',
    entityType: 'ACHIEVEMENT',
    entityId: achievement.id,
    newData: data,
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent
  })

  return achievement
}

// Cập nhật Achievement
const updateAchievement = async (adminId, achievementId, data, reqMeta = {}) => {
  const updated = await adminRepository.updateAchievement(achievementId, data)

  await adminRepository.createAuditLog({
    actorUserId: adminId,
    action: 'UPDATE_ACHIEVEMENT',
    entityType: 'ACHIEVEMENT',
    entityId: achievementId,
    newData: data,
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent
  })

  return updated
}

// Vô hiệu hóa Achievement
const deleteAchievement = async (adminId, achievementId, reqMeta = {}) => {
  const updated = await adminRepository.updateAchievement(achievementId, { isActive: false })

  await adminRepository.createAuditLog({
    actorUserId: adminId,
    action: 'DEACTIVATE_ACHIEVEMENT',
    entityType: 'ACHIEVEMENT',
    entityId: achievementId,
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent
  })

  return { success: true, message: 'Achievement deactivated successfully' }
}

// Tạo mới Reward Item
const createReward = async (adminId, data, reqMeta = {}) => {
  const reward = await adminRepository.createReward(data)

  await adminRepository.createAuditLog({
    actorUserId: adminId,
    action: 'CREATE_REWARD',
    entityType: 'REWARD_ITEM',
    entityId: reward.id,
    newData: data,
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent
  })

  return formatReward(reward)
}

// Cập nhật Reward Item
const updateReward = async (adminId, rewardId, data, reqMeta = {}) => {
  const updated = await adminRepository.updateReward(rewardId, data)

  await adminRepository.createAuditLog({
    actorUserId: adminId,
    action: 'UPDATE_REWARD',
    entityType: 'REWARD_ITEM',
    entityId: rewardId,
    newData: data,
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent
  })

  return formatReward(updated)
}

// Vô hiệu hóa Reward Item
const deleteReward = async (adminId, rewardId, reqMeta = {}) => {
  await adminRepository.updateReward(rewardId, { isActive: false })

  await adminRepository.createAuditLog({
    actorUserId: adminId,
    action: 'DEACTIVATE_REWARD',
    entityType: 'REWARD_ITEM',
    entityId: rewardId,
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent
  })

  return { success: true, message: 'Reward deactivated successfully' }
}

// Lấy danh sách Challenges cho Admin
const getChallenges = async (query = {}) => {
  const page = Number(query.page || 1)
  const limit = Number(query.limit || 20)
  const skip = (page - 1) * limit

  const { challenges, total } = await adminRepository.findAdminChallenges({ skip, take: limit })

  return {
    challenges,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Cập nhật Challenge
const updateChallenge = async (adminId, challengeId, data, reqMeta = {}) => {
  const updated = await adminRepository.updateAdminChallenge(challengeId, data)

  await adminRepository.createAuditLog({
    actorUserId: adminId,
    action: 'ADMIN_UPDATE_CHALLENGE',
    entityType: 'CHALLENGE',
    entityId: challengeId,
    newData: data,
    ipAddress: reqMeta.ip,
    userAgent: reqMeta.userAgent
  })

  return updated
}

// Thống kê toàn hệ thống
const getAdminAnalytics = async () => {
  return await adminRepository.getSystemAnalytics()
}

// Lấy danh sách Audit Logs
const getAuditLogs = async (query = {}) => {
  const page = Number(query.page || 1)
  const limit = Number(query.limit || 50)
  const skip = (page - 1) * limit

  const { logs, total } = await adminRepository.findAuditLogs({ skip, take: limit })

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export const adminService = {
  createReport,
  getReports,
  updateReport,
  getUsers,
  updateUserStatus,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  createReward,
  updateReward,
  deleteReward,
  getChallenges,
  updateChallenge,
  getAdminAnalytics,
  getAuditLogs
}
