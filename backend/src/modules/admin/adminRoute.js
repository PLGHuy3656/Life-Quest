import express from 'express'
import { adminController } from './adminController.js'
import { adminValidation } from './adminValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'
import authorizeAdmin from '../../common/middleware/authorizeAdmin.js'

// Router cho /api/v1/reports (Người dùng gửi report)
const reportsRouter = express.Router()
reportsRouter.post('/', authenticate, validate(adminValidation.createReport), adminController.createReport)

// Router cho /api/v1/admin (Dành riêng cho Admin)
const adminRouter = express.Router()

// Áp dụng xác thực và phân quyền Admin cho toàn bộ endpoint /admin/*
adminRouter.use(authenticate, authorizeAdmin)

// Quản lý người dùng
adminRouter.get('/users', validate(adminValidation.getUsers), adminController.getUsers)
adminRouter.patch('/users/:userId/status', validate(adminValidation.updateUserStatus), adminController.updateUserStatus)

// Quản lý báo cáo vi phạm
adminRouter.get('/reports', validate(adminValidation.getReports), adminController.getReports)
adminRouter.patch('/reports/:reportId', validate(adminValidation.updateReportStatus), adminController.updateReport)

// Quản lý thành tựu Achievement
adminRouter.post('/achievements', validate(adminValidation.createAchievement), adminController.createAchievement)
adminRouter.patch('/achievements/:achievementId', validate(adminValidation.updateAchievement), adminController.updateAchievement)
adminRouter.delete('/achievements/:achievementId', validate(adminValidation.achievementIdParam), adminController.deleteAchievement)

// Quản lý phần thưởng Reward
adminRouter.post('/rewards', validate(adminValidation.createReward), adminController.createReward)
adminRouter.patch('/rewards/:rewardId', validate(adminValidation.updateReward), adminController.updateReward)
adminRouter.delete('/rewards/:rewardId', validate(adminValidation.rewardIdParam), adminController.deleteReward)

// Quản lý Challenge
adminRouter.get('/challenges', adminController.getChallenges)
adminRouter.patch('/challenges/:challengeId', validate(adminValidation.updateChallengeStatus), adminController.updateChallenge)

// Thống kê & Kiểm toán
adminRouter.get('/analytics', adminController.getAdminAnalytics)
adminRouter.get('/audit-logs', adminController.getAuditLogs)

export const reportsRoute = reportsRouter
export const adminRoute = adminRouter
