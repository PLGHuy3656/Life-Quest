import { recommendationsRepository } from './recommendationsRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Lấy danh sách gợi ý
const getRecommendations = async (userId, query = {}) => {
  return await recommendationsRepository.findUserRecommendations(userId, query.status)
}

// Chấp nhận gợi ý
const acceptRecommendation = async (userId, recommendationId) => {
  const rec = await recommendationsRepository.findRecommendationById(recommendationId)
  if (!rec || rec.userId !== userId) {
    throw new ApiError(404, 'Recommendation not found', 'RECOMMENDATION_NOT_FOUND')
  }

  if (rec.status !== 'PENDING') {
    throw new ApiError(400, 'Recommendation is not pending', 'INVALID_STATUS')
  }

  const updated = await recommendationsRepository.updateRecommendationStatus(recommendationId, 'ACCEPTED', {
    acceptedAt: new Date()
  })

  return {
    success: true,
    data: updated,
    message: 'Recommendation accepted successfully'
  }
}

// Từ chối gợi ý
const rejectRecommendation = async (userId, recommendationId) => {
  const rec = await recommendationsRepository.findRecommendationById(recommendationId)
  if (!rec || rec.userId !== userId) {
    throw new ApiError(404, 'Recommendation not found', 'RECOMMENDATION_NOT_FOUND')
  }

  if (rec.status !== 'PENDING') {
    throw new ApiError(400, 'Recommendation is not pending', 'INVALID_STATUS')
  }

  const updated = await recommendationsRepository.updateRecommendationStatus(recommendationId, 'REJECTED', {
    rejectedAt: new Date()
  })

  return {
    success: true,
    data: updated,
    message: 'Recommendation rejected'
  }
}

export const recommendationsService = {
  getRecommendations,
  acceptRecommendation,
  rejectRecommendation
}
