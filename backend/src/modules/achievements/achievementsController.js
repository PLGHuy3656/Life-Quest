import { StatusCodes } from 'http-status-codes'
import { achievementsService } from './achievementsService.js'

// Lấy danh mục Huy hiệu hệ thống
const getAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id
    const achievements = await achievementsService.getAchievements(userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: achievements
    })
  } catch (error) {
    next(error)
  }
}

// Lấy chi tiết một Huy hiệu theo ID
const getAchievementById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { achievementId } = req.params
    const achievement = await achievementsService.getAchievementById(userId, achievementId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: achievement
    })
  } catch (error) {
    next(error)
  }
}

// Lấy danh sách Huy hiệu kèm tiến trình của User hiện tại
const getMyAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id
    const achievements = await achievementsService.getMyAchievements(userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: achievements
    })
  } catch (error) {
    next(error)
  }
}

export const achievementsController = {
  getAchievements,
  getAchievementById,
  getMyAchievements
}
