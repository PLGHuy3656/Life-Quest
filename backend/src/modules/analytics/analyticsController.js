import { StatusCodes } from 'http-status-codes'
import { analyticsService } from './analyticsService.js'

// Tổng quan
const getOverview = async (req, res, next) => {
  try {
    const userId = req.user.id
    const data = await analyticsService.getOverview(userId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

// Thống kê 7 ngày
const getWeekly = async (req, res, next) => {
  try {
    const userId = req.user.id
    const data = await analyticsService.getWeekly(userId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

// Thống kê Quests
const getQuests = async (req, res, next) => {
  try {
    const userId = req.user.id
    const data = await analyticsService.getQuestAnalytics(userId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

// Thống kê Focus
const getFocus = async (req, res, next) => {
  try {
    const userId = req.user.id
    const data = await analyticsService.getFocusAnalytics(userId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

// Thống kê Streaks
const getStreaks = async (req, res, next) => {
  try {
    const userId = req.user.id
    const data = await analyticsService.getStreakAnalytics(userId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

// Lịch sử Behavior Events
const getBehavior = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await analyticsService.getBehavior(userId, req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.events,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

// Ghi nhận Behavior Event
const recordEvent = async (req, res, next) => {
  try {
    const userId = req.user.id
    const event = await analyticsService.recordEvent(userId, req.body)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: event
    })
  } catch (error) {
    next(error)
  }
}

export const analyticsController = {
  getOverview,
  getWeekly,
  getQuests,
  getFocus,
  getStreaks,
  getBehavior,
  recordEvent
}
