import Joi from 'joi'

const getQuestsByUserId = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})

// Validate dữ liệu khi tạo Quest.
const createQuest = Joi.object({
  body: Joi.object({
    userId: Joi.string().uuid().required(),
    goalId: Joi.string().uuid().allow(null).optional(),
    milestoneId: Joi.string().uuid().allow(null).optional(),
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(500).allow('').optional()
  }).unknown(false),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})


export const questsValidation = {
  getQuestsByUserId,
  createQuest
}