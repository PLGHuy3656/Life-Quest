import Joi from 'joi'

// Lấy danh sách gợi ý
const getRecommendations = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    status: Joi.string().valid('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED').default('PENDING')
  })
})

// Kiểm tra recommendationId trong param
const recommendationIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    recommendationId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const recommendationsValidation = {
  getRecommendations,
  recommendationIdParam
}
