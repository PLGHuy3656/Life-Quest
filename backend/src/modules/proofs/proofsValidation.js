import Joi from 'joi'

// Lấy danh sách Proof của một Execution
const getProofsByExecutionId = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Tạo mới Proof cho Execution
const createProof = Joi.object({
  body: Joi.object({
    mediaId: Joi.string().uuid().required(),
    visibility: Joi.string().valid('PRIVATE', 'FRIENDS', 'PUBLIC').default('PRIVATE').optional()
  }).unknown(false),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Xóa mềm Proof
const deleteProof = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    proofId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Chia sẻ / thay đổi chế độ hiển thị của Proof
const shareProof = Joi.object({
  body: Joi.object({
    visibility: Joi.string().valid('FRIENDS', 'PUBLIC').required()
  }).unknown(false),
  params: Joi.object({
    proofId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const proofsValidation = {
  getProofsByExecutionId,
  createProof,
  deleteProof,
  shareProof
}
