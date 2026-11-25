import { StatusCodes } from 'http-status-codes'
import { gamificationService } from './gamificationService.js'

// Lấy tổng quan gamification của người dùng
const getGamificationMe = async (req, res, next) => {
  try {
    const userId = req.user.id
    const overview = await gamificationService.getGamificationMe(userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: overview
    })
  } catch (error) {
    next(error)
  }
}

// Lấy lịch sử biến động XP
const getXpTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await gamificationService.getXpTransactions(userId, req.query)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

// Lấy lịch sử giao dịch Coin
const getCoinTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await gamificationService.getCoinTransactions(userId, req.query)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

export const gamificationController = {
  getGamificationMe,
  getXpTransactions,
  getCoinTransactions
}
