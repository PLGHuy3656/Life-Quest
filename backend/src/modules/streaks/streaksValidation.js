import Joi from 'joi'

// Tạo quy tắc Streak mới
const createStreakRule = Joi.object({
  body: Joi.object({
    ruleType: Joi.string().trim().max(50).required(),
    targetId: Joi.string().uuid().optional().allow(null),
    targetValue: Joi.number().positive().optional().allow(null),
    frequency: Joi.string().valid('DAILY', 'WEEKLY').default('DAILY')
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Lấy danh sách quy tắc Streak
const getStreakRules = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    isActive: Joi.boolean().optional()
  })
})

// Kiểm tra ruleId trong param
const ruleIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    ruleId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật quy tắc Streak
const updateStreakRule = Joi.object({
  body: Joi.object({
    targetValue: Joi.number().positive().optional().allow(null),
    frequency: Joi.string().valid('DAILY', 'WEEKLY').optional(),
    isActive: Joi.boolean().optional()
  }),
  params: Joi.object({
    ruleId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Lấy danh sách tiến trình streaks của User
const getStreaks = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

export const streaksValidation = {
  createStreakRule,
  getStreakRules,
  ruleIdParam,
  updateStreakRule,
  getStreaks
}
