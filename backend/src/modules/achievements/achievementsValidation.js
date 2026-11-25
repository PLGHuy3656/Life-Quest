import Joi from 'joi'

// Lấy danh mục Huy hiệu
const getAchievements = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Lấy chi tiết Huy hiệu theo ID
const getAchievementById = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    achievementId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Lấy danh sách Huy hiệu của User kèm tiến trình
const getMyAchievements = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

export const achievementsValidation = {
  getAchievements,
  getAchievementById,
  getMyAchievements
}
