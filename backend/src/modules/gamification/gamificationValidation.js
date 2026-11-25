import Joi from 'joi'

// Lấy thông tin gamification của user
const getGamificationMe = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Lấy lịch sử giao dịch XP
const getXpTransactions = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sourceType: Joi.string().trim().max(50).optional()
  })
})

// Lấy lịch sử giao dịch Coin
const getCoinTransactions = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    transactionType: Joi.string().valid('EARNED', 'SPENT', 'REFUNDED').optional(),
    sourceType: Joi.string().trim().max(50).optional()
  })
})

export const gamificationValidation = {
  getGamificationMe,
  getXpTransactions,
  getCoinTransactions
}
