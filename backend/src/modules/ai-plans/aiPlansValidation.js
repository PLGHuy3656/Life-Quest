import Joi from 'joi'

// Yêu cầu AI sinh kế hoạch
const createAiPlan = Joi.object({
  body: Joi.object({
    prompt: Joi.string().trim().min(3).max(2000).required(),
    timeframeDays: Joi.number().integer().min(1).max(365).default(30),
    targetCategory: Joi.string().trim().max(50).optional().allow(null, ''),
    dailyAvailableMinutes: Joi.number().integer().min(5).max(1440).default(60)
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Kiểm tra planId trong param
const planIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    planId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật bản nháp kế hoạch
const updateAiPlan = Joi.object({
  body: Joi.object({
    generatedPlan: Joi.object().required()
  }),
  params: Joi.object({
    planId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Tái tạo kế hoạch
const regenerateAiPlan = Joi.object({
  body: Joi.object({
    feedback: Joi.string().trim().max(1000).optional().allow(null, '')
  }),
  params: Joi.object({
    planId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const aiPlansValidation = {
  createAiPlan,
  planIdParam,
  updateAiPlan,
  regenerateAiPlan
}
