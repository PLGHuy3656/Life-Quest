import { StatusCodes } from 'http-status-codes'
import { adminService } from './adminService.js'

// Helper lấy metadata request
const getReqMeta = (req) => ({
  ip: req.ip || req.headers['x-forwarded-for'] || null,
  userAgent: req.headers['user-agent'] || null
})

// Người dùng gửi báo cáo vi phạm
const createReport = async (req, res, next) => {
  try {
    const reporterId = req.user.id
    const report = await adminService.createReport(reporterId, req.body)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: report
    })
  } catch (error) {
    next(error)
  }
}

// Admin lấy danh sách báo cáo
const getReports = async (req, res, next) => {
  try {
    const result = await adminService.getReports(req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.reports,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

// Admin xử lý báo cáo
const updateReport = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const { reportId } = req.params
    const result = await adminService.updateReport(adminId, reportId, req.body, getReqMeta(req))
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Admin lấy danh sách người dùng
const getUsers = async (req, res, next) => {
  try {
    const result = await adminService.getUsers(req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.users,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

// Admin cập nhật trạng thái người dùng
const updateUserStatus = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const { userId } = req.params
    const result = await adminService.updateUserStatus(adminId, userId, req.body.status, getReqMeta(req))
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Admin tạo Achievement
const createAchievement = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const achievement = await adminService.createAchievement(adminId, req.body, getReqMeta(req))
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: achievement
    })
  } catch (error) {
    next(error)
  }
}

// Admin cập nhật Achievement
const updateAchievement = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const { achievementId } = req.params
    const updated = await adminService.updateAchievement(adminId, achievementId, req.body, getReqMeta(req))
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

// Admin xóa Achievement
const deleteAchievement = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const { achievementId } = req.params
    const result = await adminService.deleteAchievement(adminId, achievementId, getReqMeta(req))
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Admin tạo Reward Item
const createReward = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const reward = await adminService.createReward(adminId, req.body, getReqMeta(req))
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: reward
    })
  } catch (error) {
    next(error)
  }
}

// Admin cập nhật Reward Item
const updateReward = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const { rewardId } = req.params
    const updated = await adminService.updateReward(adminId, rewardId, req.body, getReqMeta(req))
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

// Admin xóa Reward Item
const deleteReward = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const { rewardId } = req.params
    const result = await adminService.deleteReward(adminId, rewardId, getReqMeta(req))
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Admin xem danh sách Challenges
const getChallenges = async (req, res, next) => {
  try {
    const result = await adminService.getChallenges(req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.challenges,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

// Admin cập nhật Challenge
const updateChallenge = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const { challengeId } = req.params
    const updated = await adminService.updateChallenge(adminId, challengeId, req.body, getReqMeta(req))
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

// Admin xem Analytics toàn hệ thống
const getAdminAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getAdminAnalytics()
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

// Admin xem Audit Logs
const getAuditLogs = async (req, res, next) => {
  try {
    const result = await adminService.getAuditLogs(req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

export const adminController = {
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
