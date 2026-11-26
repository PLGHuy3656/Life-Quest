import prisma from '../../config/database.js'

// Lấy danh sách gợi ý của User
const findUserRecommendations = async (userId, status) => {
  const where = { userId }
  if (status) {
    where.status = status
  }

  return await prisma.recommendation.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })
}

// Tìm gợi ý theo ID
const findRecommendationById = async (id) => {
  return await prisma.recommendation.findUnique({
    where: { id }
  })
}

// Cập nhật trạng thái gợi ý
const updateRecommendationStatus = async (id, status, extraData = {}) => {
  return await prisma.recommendation.update({
    where: { id },
    data: {
      status,
      ...extraData
    }
  })
}

// Tạo gợi ý mới
const createRecommendation = async (userId, data) => {
  return await prisma.recommendation.create({
    data: {
      userId,
      type: data.type,
      source: data.source,
      payload: data.payload,
      status: 'PENDING'
    }
  })
}

export const recommendationsRepository = {
  findUserRecommendations,
  findRecommendationById,
  updateRecommendationStatus,
  createRecommendation
}
