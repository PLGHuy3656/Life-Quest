import { StatusCodes } from 'http-status-codes'
import { recommendationsService } from './recommendationsService.js'

// Lấy danh sách gợi ý
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id
    const recommendations = await recommendationsService.getRecommendations(userId, req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: recommendations
    })
  } catch (error) {
    next(error)
  }
}

// Chấp nhận gợi ý
const acceptRecommendation = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { recommendationId } = req.params
    const result = await recommendationsService.acceptRecommendation(userId, recommendationId)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Từ chối gợi ý
const rejectRecommendation = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { recommendationId } = req.params
    const result = await recommendationsService.rejectRecommendation(userId, recommendationId)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const recommendationsController = {
  getRecommendations,
  acceptRecommendation,
  rejectRecommendation
}
