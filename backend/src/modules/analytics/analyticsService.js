import { analyticsRepository } from './analyticsRepository.js'

// Ghi nhận sự kiện hành vi
const recordEvent = async (userId, data) => {
  return await analyticsRepository.createBehaviorEvent(userId, data)
}

// Lấy lịch sử sự kiện hành vi
const getBehavior = async (userId, query = {}) => {
  const page = Number(query.page || 1)
  const limit = Number(query.limit || 20)
  const skip = (page - 1) * limit

  const { events, total } = await analyticsRepository.findBehaviorEvents(userId, {
    eventType: query.eventType,
    skip,
    take: limit
  })

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Thống kê tổng quan Overview
const getOverview = async (userId) => {
  return await analyticsRepository.getOverviewMetrics(userId)
}

// Thống kê 7 ngày qua
const getWeekly = async (userId) => {
  return await analyticsRepository.getWeeklyMetrics(userId)
}

// Thống kê nhiệm vụ
const getQuestAnalytics = async (userId) => {
  return await analyticsRepository.getQuestMetrics(userId)
}

// Thống kê phiên tập trung
const getFocusAnalytics = async (userId) => {
  return await analyticsRepository.getFocusMetrics(userId)
}

// Thống kê chuỗi Streak
const getStreakAnalytics = async (userId) => {
  return await analyticsRepository.getStreakMetrics(userId)
}

export const analyticsService = {
  recordEvent,
  getBehavior,
  getOverview,
  getWeekly,
  getQuestAnalytics,
  getFocusAnalytics,
  getStreakAnalytics
}
