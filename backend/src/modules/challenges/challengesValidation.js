import Joi from 'joi'

// Lấy danh sách thử thách
const getChallenges = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    status: Joi.string().valid('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED').optional(),
    myChallengesOnly: Joi.boolean().optional()
  })
})

// Tạo thử thách mới
const createChallenge = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().max(200).required(),
    description: Joi.string().trim().max(2000).optional().allow(null, ''),
    conditionType: Joi.string().trim().max(50).required(),
    conditionConfig: Joi.object().required(),
    startAt: Joi.date().iso().required(),
    endAt: Joi.date().iso().greater(Joi.ref('startAt')).required(),
    rewardConfig: Joi.object().optional().allow(null)
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Kiểm tra challengeId trong param
const challengeIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    challengeId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật thông tin thử thách
const updateChallenge = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().max(200).optional(),
    description: Joi.string().trim().max(2000).optional().allow(null, ''),
    rewardConfig: Joi.object().optional().allow(null),
    status: Joi.string().valid('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED').optional()
  }),
  params: Joi.object({
    challengeId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Mời/xử lý thành viên trong param (challengeId & targetUserId)
const challengeMemberParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    challengeId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const challengesValidation = {
  getChallenges,
  createChallenge,
  challengeIdParam,
  updateChallenge,
  challengeMemberParam
}
