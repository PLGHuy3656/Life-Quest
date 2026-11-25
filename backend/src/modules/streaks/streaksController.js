import { StatusCodes } from 'http-status-codes'
import { streaksService } from './streaksService.js'

// Lấy danh sách quy tắc Streak
const getStreakRules = async (req, res, next) => {
  try {
    const userId = req.user.id
    const rules = await streaksService.getStreakRules(userId, req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: rules
    })
  } catch (error) {
    next(error)
  }
}

// Tạo quy tắc Streak mới
const createStreakRule = async (req, res, next) => {
  try {
    const userId = req.user.id
    const rule = await streaksService.createStreakRule(userId, req.body)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: rule
    })
  } catch (error) {
    next(error)
  }
}

// Chi tiết một quy tắc Streak
const getStreakRuleById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { ruleId } = req.params
    const rule = await streaksService.getStreakRuleById(userId, ruleId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: rule
    })
  } catch (error) {
    next(error)
  }
}

// Cập nhật quy tắc Streak
const updateStreakRule = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { ruleId } = req.params
    const updated = await streaksService.updateStreakRule(userId, ruleId, req.body)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

// Xóa quy tắc Streak
const deleteStreakRule = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { ruleId } = req.params
    const result = await streaksService.deleteStreakRule(userId, ruleId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Lấy danh sách tiến trình Streaks của User
const getStreaks = async (req, res, next) => {
  try {
    const userId = req.user.id
    const streaks = await streaksService.getMyStreaks(userId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: streaks
    })
  } catch (error) {
    next(error)
  }
}

export const streaksController = {
  getStreakRules,
  createStreakRule,
  getStreakRuleById,
  updateStreakRule,
  deleteStreakRule,
  getStreaks
}
